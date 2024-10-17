// Top Frame Eagle Script

// Create the main panel
var mainPanel = new Window("palette", "Top Frame Eagle", undefined);
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
        activeComp.name = "Top Frame Eagle " + compName;
        
        // Find the "Name Placeholder" composition
        var namePlaceholderComp;
        for (var i = 1; i <= activeComp.numLayers; i++) {
            var layer = activeComp.layer(i);
            if (layer.source instanceof CompItem && layer.source.name === "Name Placeholder") {
                namePlaceholderComp = layer.source;
                break;
            }
        }
        
        if (namePlaceholderComp) {
            // Change the text of the last layer in the "Name Placeholder" composition
            var lastLayer = namePlaceholderComp.layer(namePlaceholderComp.numLayers);
            if (lastLayer instanceof TextLayer) {
                var textProp = lastLayer.property("Source Text");
                var textDocument = textProp.value;
                textDocument.text = enteredName;
                textProp.setValue(textDocument);
            } else {
                alert("The last layer in 'Name Placeholder' composition is not a text layer.");
            }
        } else {
            alert("Could not find 'Name Placeholder' composition in the active composition.");
        }
        
        // Success alert removed
    } else {
        alert("Please select a composition first.");
    }
}

// Attach the function to the button
applyButton.onClick = applyChanges;

// Show the panel
mainPanel.show();
