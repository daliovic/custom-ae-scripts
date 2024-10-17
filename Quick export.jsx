// Quick export script with UI

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

    // Add checkbox
    var useSelectedComps = checkboxGroup.add("checkbox", undefined, "Use selected compositions");

    // Add comp count text
    var compCountText = checkboxGroup.add("statictext", undefined, "");
    
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
                return;
            }
        } else {
            var activeComp = app.project.activeItem;
            if (!activeComp || !(activeComp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }
            compsToExport.push(activeComp);
        }

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
            
            // Create render queue item
            var renderItem = renderQueue.items.add(curComp);
            
            // Set output path
            var outputModule = renderItem.outputModule(1);
            outputModule.file = outputFile;
        }
        
        // Start render
        renderQueue.render();

        // Close the window
        mainWindow.close();
    };

    // Initial update of comp count
    updateCompCount();

    // Show the window
    mainWindow.show();
})();
