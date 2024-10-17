// Create UI Panel
var myPanel = new Window("palette", "WebP Exporter", undefined);
myPanel.orientation = "column";

// Create a group for Quality slider and text
var qualityGroup = myPanel.add("group", undefined);
qualityGroup.orientation = "row";

// Move these inside the qualityGroup
var myStaticText = qualityGroup.add("statictext", undefined, "Quality:");
var mySlider = qualityGroup.add("slider", undefined, 20, 0, 100);
var myEditText = qualityGroup.add("edittext", undefined, mySlider.value);
myEditText.characters = 5;

// Create dimensions control
var dimensionsGroup = myPanel.add("group", undefined);
dimensionsGroup.orientation = "row";
var widthText = dimensionsGroup.add("statictext", undefined, "Width:");
var widthInput = dimensionsGroup.add("edittext", undefined, "270"); // Default width
widthInput.characters = 5;
var heightText = dimensionsGroup.add("statictext", undefined, "Height:");
var heightInput = dimensionsGroup.add("edittext", undefined, "270"); // Default height
heightInput.characters = 5;

// Slider change events
mySlider.onChanging = function () {
  myEditText.text = Math.round(mySlider.value);
};

// Add a checkbox for PNG compression
var checkboxGroup = myPanel.add("group", undefined);
checkboxGroup.orientation = "row";
var compressCheckbox = checkboxGroup.add(
  "checkbox",
  undefined,
  "Compress PNGs"
);
compressCheckbox.value = true; // Default to checked

// Add a checkbox for running on open compositions
var openCompsGroup = myPanel.add("group", undefined);
openCompsGroup.orientation = "row";
var openCompsCheckbox = openCompsGroup.add(
  "checkbox",
  undefined,
  "Run on open compositions"
);
openCompsCheckbox.value = false; // Default to unchecked

// Add text to display number of open compositions
var openCompsText = openCompsGroup.add("statictext", undefined, "");
updateOpenCompsCount();

// Create a group for Quality Range inputs
var qualityRangeGroup = myPanel.add("group", undefined);
qualityRangeGroup.orientation = "row";

var lowQualityText = qualityRangeGroup.add(
  "statictext",
  undefined,
  "Lowest Quality:"
);
var lowQualityInput = qualityRangeGroup.add("edittext", undefined, "0");
lowQualityInput.characters = 5;

var highQualityText = qualityRangeGroup.add(
  "statictext",
  undefined,
  "Highest Quality:"
);
var highQualityInput = qualityRangeGroup.add("edittext", undefined, "100");
highQualityInput.characters = 5;

// Button for exporting
var myButton = myPanel.add("button", undefined, "Export");
myButton.onClick = function () {
  var qualityValue = Math.round(mySlider.value);
  var compsToExport = openCompsCheckbox.value ? getOpenCompositions() : [app.project.activeItem];
  
  for (var i = 0; i < compsToExport.length; i++) {
    var curComp = compsToExport[i];
    if (curComp && curComp instanceof CompItem) {
      var exportInfo = runExport(qualityValue, curComp);
      if (exportInfo) {
        generateIcons(exportInfo.subDir, exportInfo.currentCompName);
        if (compressCheckbox.value) {
          // Path to the VBScript file
          var vbsPath =
            "C:\\Users\\dalid\\OneDrive\\Documents\\Scripts\\RunSilent.vbs";
          var lowQualityValue = lowQualityInput.text;
          var highQualityValue = highQualityInput.text;
          var qualityRange = lowQualityValue + "-" + highQualityValue;
          // Command to execute the VBScript, which in turn executes the batch file
          var vbscriptCommand =
            'cmd.exe /c wscript "' +
            vbsPath +
            '" "C:\\Users\\dalid\\OneDrive\\Documents\\Scripts\\CompressPNGNew.bat" "' +
            exportInfo.windowsPath +
            '" ' +
            qualityRange;

          system.callSystem(vbscriptCommand);
        }
      }
    }
  }
};

myPanel.show();

function updateOpenCompsCount() {
  var openComps = getOpenCompositions();
  openCompsText.text = "(" + openComps.length + " open)";
}

function getOpenCompositions() {
  var openComps = [];
  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof CompItem && item.openInViewer) {
      openComps.push(item);
    }
  }
  return openComps;
}

function runExport(qualityValue, curComp) {
  // Function to open folder
  function openFolder(path) {
    var folder = new Folder(path);
    if (folder.exists) {
      folder.execute();
    }
  }

  // Check if a project is open
  if (app.project === null) {
    alert("Please open a project first.");
  } else {
    // Check if the project is saved
    if (app.project.file === null) {
      alert("Please save the project first.");
    } else {
      if (!curComp || !(curComp instanceof CompItem)) {
        alert("Please select a composition.");
      } else {
        // Get the project file path
        var projectPath = app.project.file.path;

        // Create sub-directory with comp name if it doesn't exist
        var subDir = new Folder(projectPath + "/" + curComp.name);
        if (!subDir.exists) {
          subDir.create();
        }

        // Create 'PNG' subfolder inside comp-named folder if it doesn't exist
        var pngSubDir = new Folder(subDir.absoluteURI + "/PNG");
        if (!pngSubDir.exists) {
          pngSubDir.create();
        }

        // Build export path for MOV
        var outputPathMOV = subDir.absoluteURI + "/" + curComp.name + ".mov";

        // Build export paths for PNG sequence
        var outputPathPNG = pngSubDir.absoluteURI + "/frame[####].png";

        // Create render queue item and set render settings
        var renderQueue = app.project.renderQueue;
        var renderItem = renderQueue.items.add(curComp);
        renderItem.applyTemplate("Frame 20");

        // Add Output Module for MOV
        var outputModuleMOV = renderItem.outputModules.add();
        outputModuleMOV.applyTemplate("Frame MOV");
        outputModuleMOV.file = new File(outputPathMOV);

        // Add Output Module for PNG
        var outputModulePNG = renderItem.outputModules.add();
        outputModulePNG.applyTemplate("Frame PNG");
        outputModulePNG.file = new File(outputPathPNG);

        // Remove default output module
        renderItem.outputModules[1].remove();

        // Start render
        renderQueue.render();

        // Set callback for render finish event
        // Wait for render to finish (Be cautious, as this will hang AE until rendering is complete)
        while (
          renderItem.status != RQItemStatus.DONE &&
          renderItem.status != RQItemStatus.USER_STOPPED &&
          renderItem.status != RQItemStatus.ERR_STOPPED
        ) {
          $.sleep(2000); // wait for 2 seconds before checking again
        }

        if (renderItem.status == RQItemStatus.DONE) {
          // Extract the drive letter from the project's file system name
          var driveLetter = app.project.file.fsName.split(":")[0];

          // Convert absoluteURI to a Windows-friendly, unencoded path
          var rawPath = Folder.decode(subDir.absoluteURI).replace(/\//g, "\\");

          // Replace the initial backslash with the correct drive letter
          var windowsPath = rawPath.replace(/^\\[a-z]/i, driveLetter + ":");

          // Get dimensions from input
          var width = parseInt(widthInput.text);
          var height = parseInt(heightInput.text);

          // Prepare and run the ffmpeg command with added dimension parameters
          var ffmpegCommand =
            'cmd.exe /c ffmpeg -i "' +
            windowsPath +
            "\\" +
            curComp.name +
            '.mov" -vf "fps=20,scale=' +
            width +
            ":" +
            height +
            '" -c:v libwebp_anim -lossless 0 -q:v ' +
            qualityValue +
            ' -loop 0 -an -y "' +
            windowsPath +
            "\\" +
            curComp.name +
            '.webp"';

          system.callSystem(ffmpegCommand);
          var deleteMOVCommand = 'cmd.exe /c del "' + outputPathMOV + '"';
          system.callSystem(deleteMOVCommand);

          return {
            subDir: subDir,
            currentCompName: curComp.name,
            windowsPath: windowsPath,
          };
        }
      }
    }
  }
  return null;
}

function generateIcons(subDir, currentCompName) {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    alert("No comp selected.");
    return;
  }

  // Function to create thumbnail
  function createThumbnail(tempCompWidth, tempCompHeight, iconNameSuffix) {
    var tempComp = app.project.items.addComp(
      "Temp_" + tempCompWidth + "x" + tempCompHeight,
      tempCompWidth,
      tempCompHeight,
      comp.pixelAspect,
      comp.duration,
      comp.frameRate
    );

    var tempLayer = tempComp.layers.add(comp);
    var scaleFactor = Math.min(
      tempCompWidth / comp.width,
      tempCompHeight / comp.height
    );
    tempLayer.scale.setValue([scaleFactor * 100, scaleFactor * 100]);
    tempLayer.position.setValue([tempComp.width / 2, tempComp.height / 2]);

    var iconPath =
      subDir.fsName +
      "/" +
      currentCompName +
      " Icon " +
      iconNameSuffix +
      ".png";
    tempComp.saveFrameToPng(comp.time, File(iconPath));

    tempComp.remove();
  }

  // Generate 270x270 thumbnail
  createThumbnail(270, 270, "270");

  // Generate 282x210 thumbnail
  createThumbnail(282, 210, "282");
}

// Update open compositions count when the panel is shown
myPanel.onShow = function() {
  updateOpenCompsCount();
};
