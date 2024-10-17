// Check if a project is open
if (app.project === null) {
    alert("Please open a project first.");
} else {
    // Check if the project is saved
    if (app.project.file === null) {
        alert("Please save the project first.");
    } else {
        // Get the current composition
        var curComp = app.project.activeItem;
        
        if (!curComp || !(curComp instanceof CompItem)) {
            alert("Please select a composition.");
        } else {
            // Get the project file path
            var projectPath = app.project.file.path;
            
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
            var renderQueue = app.project.renderQueue;
            var renderItem = renderQueue.items.add(curComp);
            
            // Set output path
            var outputModule = renderItem.outputModule(1);
            outputModule.file = outputFile;
            
            // Start render
            renderQueue.render();
        }
    }
}