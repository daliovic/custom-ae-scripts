// Lion Reveal Script

// Create the main panel
var mainPanel = new Window("palette", "Lion Reveal", undefined);
mainPanel.orientation = "column";

// Create input field for the name
var nameGroup = mainPanel.add("group");
nameGroup.orientation = "row";
nameGroup.add("statictext", undefined, "Name:");
var nameInput = nameGroup.add("edittext", undefined, "");
nameInput.characters = 20;
var nameClearButton = nameGroup.add("button", undefined, "Clear");

// Create input field for the comp name
var compNameGroup = mainPanel.add("group");
compNameGroup.orientation = "row";
compNameGroup.add("statictext", undefined, "Comp Name:");
var compNameInput = compNameGroup.add("edittext", undefined, "");
compNameInput.characters = 20;
var compNameClearButton = compNameGroup.add("button", undefined, "Clear");

// Create button to apply changes
var applyButton = mainPanel.add("button", undefined, "Apply Changes");

// Function to clear name input
function clearNameInput() {
    nameInput.text = "";
}

// Function to clear comp name input
function clearCompNameInput() {
    compNameInput.text = "";
}

// Attach clear functions to clear buttons
nameClearButton.onClick = clearNameInput;
compNameClearButton.onClick = clearCompNameInput;

// Function to change composition name and update text layer
function applyChanges() {
    var enteredName = nameInput.text;
    var enteredCompName = compNameInput.text;
    
    // Get the active composition
    var activeComp = app.project.activeItem;
    
    if (activeComp && activeComp instanceof CompItem) {
        // Change the name of the active composition
        // If comp name is not specified, use the entered name
        var compName = enteredCompName !== "" ? enteredCompName : enteredName;
        activeComp.name = "Lion Reveal " + compName;
        
        // Find the "Text_Holder" composition
        var textHolderComp;
        for (var i = 1; i <= activeComp.numLayers; i++) {
            var layer = activeComp.layer(i);
            if (layer.source instanceof CompItem && layer.source.name === "Text_Holder") {
                textHolderComp = layer.source;
                break;
            }
        }
        
        if (textHolderComp) {
            // Find and change the text of the first text layer in the "Text_Holder" composition
            var textLayer;
            for (var j = 1; j <= textHolderComp.numLayers; j++) {
                if (textHolderComp.layer(j) instanceof TextLayer) {
                    textLayer = textHolderComp.layer(j);
                    break;
                }
            }
            
            if (textLayer) {
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;
                textDocument.text = enteredName;
                textProp.setValue(textDocument);
                alert("Changes applied successfully!");
            } else {
                alert("Could not find a text layer in 'Text_Holder' composition.");
            }
        } else {
            alert("Could not find 'Text_Holder' composition in the active composition.");
        }
    } else {
        alert("Please select a composition first.");
    }
}

// Attach the function to the button
applyButton.onClick = applyChanges;

// Show the panel
mainPanel.show();
