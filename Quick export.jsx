// Quick export script with UI and FFmpeg compression

(function() {
    // Check if a project is open
    if (app.project === null) {
        alert("Please open a project first.");
        return;
    }

    // Check if the project is saved
    if (app.project.file === null) {
        alert("Please save the project first.");
        return;
    }

    // Create log file
    var logFile = new File(app.project.file.path + "/quick_export_log.txt");
    logFile.open("w");
    function log(message) {
        var date = new Date();
        logFile.writeln(date.toLocaleString() + ": " + message);
    }

    log("Script started");

    // Create the main window
    var mainWindow = new Window("palette", "Quick Export", undefined);
    mainWindow.orientation = "column";
    mainWindow.alignChildren = ["center", "top"];
    mainWindow.spacing = 10;
    mainWindow.margins = 16;

    // Create a group for the checkbox and comp count
    var checkboxGroup = mainWindow.add("group");
    checkboxGroup.orientation = "row";
    checkboxGroup.alignChildren = ["left", "center"];
    checkboxGroup.spacing = 10;

    // Add checkbox for selected comps
    var useSelectedComps = checkboxGroup.add("checkbox", undefined, "Use selected compositions");

    // Add comp count text
    var compCountText = checkboxGroup.add("statictext", undefined, "");

    // Add checkbox for FFmpeg compression
    var useFFmpeg = mainWindow.add("checkbox", undefined, "Use FFmpeg compression");
    useFFmpeg.value = true; // Set compression checked by default
    
    // Add export button
    var exportButton = mainWindow.add("button", undefined, "Export");

    // Function to update comp count
    function updateCompCount() {
        var count = 0;
        if (useSelectedComps.value) {
            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i) instanceof CompItem && app.project.item(i).selected) {
                    count++;
                }
            }
            compCountText.text = count + " comp" + (count !== 1 ? "s" : "") + " selected";
        } else {
            compCountText.text = "";
        }
    }

    // Event listener for checkbox
    useSelectedComps.onClick = updateCompCount;

    // Function to run FFmpeg compression
    function runFFmpegCompression(inputPath, outputPath) {
        // Extract the drive letter from the project's file system name
        var driveLetter = app.project.file.fsName.split(":")[0];

        // Convert absoluteURI to a Windows-friendly path with spaces
        var windowsInputPath = Folder.decode(inputPath).replace(/\//g, "\\");
        var windowsOutputPath = Folder.decode(outputPath).replace(/\//g, "\\");

        // Ensure the drive letter is correct and remove any extra "e\"
        windowsInputPath = driveLetter + ":" + windowsInputPath.substr(windowsInputPath.indexOf("\\")).replace(/^\\e\\/, "\\");
        windowsOutputPath = driveLetter + ":" + windowsOutputPath.substr(windowsOutputPath.indexOf("\\")).replace(/^\\e\\/, "\\");

        var ffmpegCmd = 'cmd.exe /c ffmpeg -i "' + windowsInputPath + '" -c:v libx264 -preset placebo -crf 23 -b:v 1400k -maxrate 1400k -bufsize 2800k -vf "fps=24" -profile:v main -level 4.0 -x264-params "me=hex:subme=7:rc-lookahead=60:ref=4:bframes=3:b-adapt=2" -c:a copy -y "' + windowsOutputPath + '"';
        log("Running FFmpeg command: " + ffmpegCmd);
        var result = system.callSystem(ffmpegCmd);
        log("FFmpeg result: " + result);
        return result;
    }

    // Event listener for export button
    exportButton.onClick = function() {
        var compsToExport = [];
        
        if (useSelectedComps.value) {
            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i) instanceof CompItem && app.project.item(i).selected) {
                    compsToExport.push(app.project.item(i));
                }
            }
            if (compsToExport.length === 0) {
                alert("Please select at least one composition.");
                log("No compositions selected");
                return;
            }
        } else {
            var activeComp = app.project.activeItem;
            if (!activeComp || !(activeComp instanceof CompItem)) {
                alert("Please select a composition.");
                log("No active composition");
                return;
            }
            compsToExport.push(activeComp);
        }

        log("Compositions to export: " + compsToExport.length);

        // Get the project file path
        var projectPath = app.project.file.path;

        // Create render queue items for each composition
        var renderQueue = app.project.renderQueue;
        
        for (var i = 0; i < compsToExport.length; i++) {
            var curComp = compsToExport[i];
            
            // Build export path
            var outputPath = projectPath + "/" + curComp.name + ".mp4";
            var outputFile = new File(outputPath);

            // Check if file already exists and rename if needed
            var counter = 1;
            while (outputFile.exists) {
                outputPath = projectPath + "/" + curComp.name + "_" + counter + ".mp4";
                outputFile = new File(outputPath);
                counter++;
            }
            
            log("Exporting to: " + outputPath);

            // Create render queue item
            var renderItem = renderQueue.items.add(curComp);
            
            // Set output path
            var outputModule = renderItem.outputModule(1);
            outputModule.file = outputFile;
        }
        
        // Start render
        log("Starting render");
        renderQueue.render();
        log("Render completed");

        // Apply FFmpeg compression if selected
        if (useFFmpeg.value) {
            for (var i = 0; i < compsToExport.length; i++) {
                var curComp = compsToExport[i];
                var originalPath = projectPath + "/" + curComp.name + ".mp4";
                var uncompressedPath = projectPath + "/" + curComp.name + "_uncompressed.mp4";
                
                // Check if the original file exists
                var originalFile = new File(originalPath);
                if (!originalFile.exists) {
                    log("ERROR: Original file not found: " + originalPath);
                    continue;
                }

                // Check if uncompressed file already exists
                var uncompressedFile = new File(uncompressedPath);
                if (uncompressedFile.exists) {
                    log("WARNING: Uncompressed file already exists: " + uncompressedPath);
                    log("Skipping rename and using existing uncompressed file for compression.");
                } else {
                    // Rename original file
                    log("Renaming " + originalPath + " to " + uncompressedPath);
                    var renameResult = originalFile.rename(uncompressedPath);
                    log("Rename result: " + renameResult);

                    if (!renameResult) {
                        log("ERROR: Failed to rename original file. Error: " + originalFile.error);
                        continue;
                    }
                }

                // Run FFmpeg compression
                log("Starting FFmpeg compression for " + curComp.name);
                var ffmpegResult = runFFmpegCompression(uncompressedPath, originalPath);
                log("FFmpeg compression completed for " + curComp.name);

                // Check if compressed file exists
                var compressedFile = new File(originalPath);
                if (compressedFile.exists) {
                    log("Compressed file created successfully: " + originalPath);
                } else {
                    log("ERROR: Compressed file not found: " + originalPath);
                }
            }
            alert("Export and compression completed! Check log file for details.");
        } else {
            alert("Export completed!");
        }

        log("Script execution completed");
        logFile.close();

        // Close the window
        mainWindow.close();
    };

    // Initial update of comp count
    updateCompCount();

    // Show the window
    mainWindow.show();
})();
