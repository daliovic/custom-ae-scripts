// Arab Frame Script

// Create the main panel
var mainPanel = new Window("palette", "Arab Frame", undefined);
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

// Function to find a composition that starts with a given prefix
function findCompWithPrefix(prefix) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name.indexOf(prefix) === 0) {
            return item;
        }
    }
    return null;
}

// Function to find a composition that ends with "frame"
function findCompEndingWithFrame() {
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name.toLowerCase().endsWith("frame")) {
            return item;
        }
    }
    return null;
}

// Function to change composition names and update text layer
function applyChanges() {
    var enteredName = nameInput.text;
    var enteredCompName = compNameInput.text;
    
    // If comp name is not specified, use the entered name
    var compName = enteredCompName !== "" ? enteredCompName : enteredName;
    
    // Get the active composition (assumed to be Arab Frame comp)
    var activeComp = app.project.activeItem;
    
    // Find the King Entrance comp
    var kingEntranceComp = findCompWithPrefix("King Entrance");
    
    // Find the comp ending with "frame"
    var frameComp = findCompEndingWithFrame();
    
    var messages = [];
    
    if (activeComp && activeComp instanceof CompItem) {
        // Change the name of the active composition (Arab Frame)
        activeComp.name = "Arab Frame " + compName;
        
        // Find the "Name" layer in the main composition
        var nameLayer;
        for (var i = 1; i <= activeComp.numLayers; i++) {
            var layer = activeComp.layer(i);
            if (layer.name === "Name" && layer instanceof TextLayer) {
                nameLayer = layer;
                break;
            }
        }
        
        if (nameLayer) {
            // Change the text of the "Name" layer
            var textProp = nameLayer.property("Source Text");
            var textDocument = textProp.value;
            textDocument.text = enteredName;
            textProp.setValue(textDocument);
            
            messages.push("Arab Frame composition updated successfully.");
        } else {
            messages.push("Could not find 'Name' layer in the Arab Frame composition.");
        }
    } else {
        messages.push("Please select the Arab Frame composition first.");
    }
    
    // Update King Entrance comp name
    if (kingEntranceComp) {
        kingEntranceComp.name = "King Entrance " + compName;
        messages.push("King Entrance composition renamed successfully.");
    } else {
        messages.push("Could not find a composition starting with 'King Entrance'.");
    }
    
    // Update comp ending with "frame"
    if (frameComp) {
        frameComp.name = enteredName + " frame";
        messages.push("'" + enteredName + " frame' composition renamed successfully.");
    } else {
        messages.push("Could not find a composition ending with 'frame'.");
    }
    
    // Success alert removed
}

// Attach the function to the button
applyButton.onClick = applyChanges;

// Show the panel
mainPanel.show();
