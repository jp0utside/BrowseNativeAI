// ===State Management===
let currentAttributes = null;
let currentTab = null;
let appliedChanges = new Map(); // Track changes: key -> { originalValue, currentValue }

// ===Initialize===
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    getCurrentTab();
});

async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
}

// ===Event Listeners===
function setupEventListeners() {
    document.getElementById('scan-btn').addEventListener('click', handleScan);
    document.getElementById('reset-btn').addEventListener('click', handleReset);
    
    // Basic controls
    document.getElementById('min-text-size').addEventListener('input', handleMinTextSize);
    document.getElementById('min-button-size').addEventListener('input', handleMinButtonSize);
    
    // Button group controls
    setupButtonGroup('text-contrast-group', handleTextContrast);
    setupButtonGroup('spacing-group', handleSpacing);
    
    // Advanced mode toggle
    document.getElementById('advanced-mode-toggle').addEventListener('click', toggleAdvancedMode);
    
    // Section collapse toggles
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const section = e.currentTarget.closest('.attribute-section');
            if (section) {
                section.classList.toggle('collapsed');
            }
        });
    });
}

// ===Scan Page===
async function handleScan() {
    try {
        showStatus('Scanning page...', 'info');
        setButtonLoading('scan-btn', true);

        if (!currentTab) {
            await getCurrentTab();
        }

        const response = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'scanPage'
        });

        if (response.error) {
            showStatus('Error: ' + response.error, 'error');
            setButtonLoading('scan-btn', false);
            return;
        }

        // Clear previous changes when scanning
        appliedChanges.clear();
        
        currentAttributes = response.attributes;
        displayAttributes(response.attributes);

        const totalCount = getTotalAttributeCount(response.attributes);
        showStatus(`Found ${totalCount} attribute groups`, 'success');

        // Initialize basic controls with detected minimum values
        initializeBasicControls(response.attributes.minTextSize, response.attributes.minButtonSize);

        // Show basic controls and advanced mode
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('basic-controls').style.display = 'block';
        document.getElementById('advanced-mode').style.display = 'block';

        setButtonLoading('scan-btn', false);
    } catch (error) {
        console.error('Error scanning: ', error);
        setButtonLoading('scan-btn', false);

        if (error.message.includes('Could not establish connection')) {
            showStatus('Please refresh the page first!', 'error');
        } else {
            showStatus('Error: ' + error.message, 'error');
        }
    }
}

// ===Reset All===
async function handleReset() {
    try {
        setButtonLoading('reset-btn', 'true');

        if (!currentTab) {
            await getCurrentTab();
        }

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'reset'
        });

        //Hide controls and show empty state
        document.getElementById('basic-controls').style.display = 'none';
        document.getElementById('advanced-mode').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';

        // Reset sliders to default
        const minTextSlider = document.getElementById('min-text-size');
        const minButtonSlider = document.getElementById('min-button-size');
        
        minTextSlider.value = minTextSlider.min;
        minTextSlider.disabled = true;
        minButtonSlider.value = minButtonSlider.min;
        minButtonSlider.disabled = true;
        
        document.getElementById('min-text-size-value').textContent = '--';
        document.getElementById('min-button-size-value').textContent = '--';
        
        // Reset button groups
        resetButtonGroup('text-contrast-group');
        resetButtonGroup('spacing-group');
        
        currentAttributes = null;
        appliedChanges.clear();

        showStatus('All changes reset!', 'success');
        setButtonLoading('reset-btn', false);
    } catch (error) {
        console.error('Error resetting: ', error);
        showStatus('Error resetting changes', 'error');
        setButtonLoading('reset-btn', false);
    }
}

// ===Display Attributes===
function displayAttributes(attributes) {
    //Show each option
    displayAttributeCategory('font-sizes', attributes.fontSizes, 'fontSize', 'plusMinus');
    displayAttributeCategory('colors', attributes.color, 'color', 'colorPreview');
    displayAttributeCategory('backgrounds', attributes.backgrounds, 'backgroundColor', 'colorPreview');
    displayAttributeCategory('paddings', attributes.paddings, 'padding', 'plusMinus');
    displayAttributeCategory('margins', attributes.margins, 'margin', 'plusMinus');
}

function displayAttributeCategory(categoryId, items, attributeType, controlType) {
    const listContainer = document.getElementById(`${categoryId}-list`);
    const countBadge = document.getElementById(`${categoryId}-count`);
    const section = document.getElementById(`${categoryId}-section`);

    if (!items || !Array.isArray(items)) {
        items = [];
    }

    listContainer.innerHTML = '';
    countBadge.textContent = items.length;

    //Hide if items is empty
    if (items.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    items.forEach(item => {
        const changeKey = getChangeKey(attributeType, item.elementIds);
        const change = appliedChanges.get(changeKey);
        
        const itemEl = createAttributeItem({
            value: item.value,
            count: item.count,
            elementIds: item.elementIds,
            type: attributeType,
            controls: controlType,
            currentValue: change ? change.currentValue : null
        });
        listContainer.appendChild(itemEl);
    });
}

// ===Create Attribute Item===
function createAttributeItem(config) {
    const { value, count, elementIds, type, controls, currentValue } = config;

    const item = document.createElement('div');
    item.className = 'attribute-item';
    
    // Store data for later updates
    item.dataset.originalValue = value;
    item.dataset.elementIds = JSON.stringify(elementIds);
    item.dataset.type = type;

    //Color preview for colors and background
    if (controls == 'colorPreview') {
        const preview = document.createElement('div');
        preview.className = 'color-preview';
        preview.style.backgroundColor = currentValue || value;
        preview.title = 'Click to change color';

        //Click handler
        preview.onclick = (e) => {
            e.stopPropagation();
            openColorPicker(type, value, elementIds, preview, item);
        };

        item.appendChild(preview);
    }

    //Info section
    const info = document.createElement('div');
    info.className = 'attribute-info';

    // Value display - show original and current if changed
    const valueEl = document.createElement('div');
    valueEl.className = 'attribute-value';
    
    if (currentValue && currentValue !== value) {
        // Show both original and current
        const originalSpan = document.createElement('span');
        originalSpan.className = 'value-original';
        originalSpan.textContent = value;
        originalSpan.title = `Original: ${value}`;
        
        const arrow = document.createElement('span');
        arrow.className = 'value-arrow';
        arrow.textContent = ' → ';
        
        const currentSpan = document.createElement('span');
        currentSpan.className = 'value-current';
        currentSpan.textContent = currentValue;
        currentSpan.title = `Current: ${currentValue}`;
        
        valueEl.appendChild(originalSpan);
        valueEl.appendChild(arrow);
        valueEl.appendChild(currentSpan);
    } else {
        // Show only current value
        valueEl.textContent = value;
        valueEl.title = value;
    }

    const countEl = document.createElement('div');
    countEl.className = 'attribute-count';
    countEl.textContent = `${count} element${count !== 1 ? 's' : ''}`;

    info.appendChild(valueEl);
    info.appendChild(countEl);
    item.appendChild(info);

    //Controls
    if (controls == 'plusMinus') {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'attribute-controls';

        const minusBtn = document.createElement('button');
        minusBtn.className = 'control-btn';
        minusBtn.textContent = '-';
        minusBtn.title = 'Decrease';

        minusBtn.onclick = (e) => {
            e.stopPropagation();
            adjustAttribute(type, value, elementIds, -1, item);
        };

        const plusBtn = document.createElement('button');
        plusBtn.className = 'control-btn';
        plusBtn.textContent = '+';
        plusBtn.title = 'Increase';

        plusBtn.onclick = (e) => {
            e.stopPropagation();
            adjustAttribute(type, value, elementIds, 1, item);
        };

        controlsDiv.appendChild(minusBtn);
        controlsDiv.appendChild(plusBtn);
        item.appendChild(controlsDiv)
    }

    // Activate item highlighting with hover
    item.addEventListener('mouseenter', () => {
        highlightElements(elementIds);
    });

    item.addEventListener('mouseleave', () => {
        clearHighlights();
    });

    return item;
}

// ===Adjust Attributes===
async function adjustAttribute(type, originalValue, elementIds, direction, itemElement) {
    // Get the current value from tracked changes or use original
    const changeKey = getChangeKey(type, elementIds);
    const change = appliedChanges.get(changeKey);
    const currentValue = change ? change.currentValue : originalValue;
    
    const newValue = calculateNewValue(type, currentValue, direction);

    try {
        if (!currentTab) {
            await getCurrentTab();
        }

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'applyChange',
            attributeType: type,
            oldValue: currentValue,
            newValue: newValue,
            elementIds: elementIds
        });

        // Track the change
        appliedChanges.set(changeKey, {
            originalValue: originalValue,
            currentValue: newValue
        });
        
        // Update the UI to show the change
        updateItemDisplay(itemElement, originalValue, newValue);

    } catch (error) {
        console.error('Error applying changes: ', error);
        showStatus('Error applying changes', 'error');
    }
}

function calculateNewValue(type, oldValue, direction) {
    if (type === 'fontSize') {
        const size = parseFloat(oldValue);
        const unit = oldValue.replace(size, '');
        const newSize = Math.max(8, size + (direction * 2)); //Minumum 8px font size
        return `${newSize}${unit}`;
    }

    if (type == 'padding' || type == 'margin') {
        const size = parseFloat(oldValue);
        const unit = oldValue.replace(size, '').trim();
        const newSize = Math.max(0, size + (direction * 4)); //No negative padding or margin
        return `${newSize}${unit}`;
    }

    return oldValue;
}

// Generate unique key for tracking changes
function getChangeKey(type, elementIds) {
    return `${type}-${JSON.stringify(elementIds)}`;
}

// Update item display to show original -> current value
function updateItemDisplay(itemElement, originalValue, newValue) {
    const valueEl = itemElement.querySelector('.attribute-value');
    if (!valueEl) return;
    
    // Clear existing content
    valueEl.innerHTML = '';
    
    if (newValue !== originalValue) {
        // Show both original and current
        const originalSpan = document.createElement('span');
        originalSpan.className = 'value-original';
        originalSpan.textContent = originalValue;
        originalSpan.title = `Original: ${originalValue}`;
        
        const arrow = document.createElement('span');
        arrow.className = 'value-arrow';
        arrow.textContent = ' → ';
        
        const currentSpan = document.createElement('span');
        currentSpan.className = 'value-current';
        currentSpan.textContent = newValue;
        currentSpan.title = `Current: ${newValue}`;
        
        valueEl.appendChild(originalSpan);
        valueEl.appendChild(arrow);
        valueEl.appendChild(currentSpan);
    } else {
        // Show only current value
        valueEl.textContent = originalValue;
        valueEl.title = originalValue;
    }
}

// ===Highlight Elements===
async function highlightElements(elementIds) {
    try {
        if (!currentTab) {
            await getCurrentTab();
        }

        // Checking to make sure elementsIds is array
        const validIds = Array.isArray(elementIds) ? elementIds : [];

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'highlightElements',
            elementIds: validIds
        });

    } catch (error) {
        console.error('Error highlighting: ', error);
    }
}

async function clearHighlights() {
    try {
        if (!currentTab) {
            await getCurrentTab();
        }

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'clearHighlights'
        });
    } catch (error) {
        console.error('Error clearing highlights: ', error);
    }
}

// ===Button Group Setup===
function setupButtonGroup(groupId, handler) {
    const group = document.getElementById(groupId);
    const buttons = group.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons in this group
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            btn.classList.add('active');
            // Call handler with the value
            handler(parseInt(btn.dataset.value));
        });
    });
}

// ===Initialize Basic Controls===
function initializeBasicControls(minTextSize, minButtonSize) {
    // Set up minimum text size slider
    const minTextSlider = document.getElementById('min-text-size');
    minTextSlider.min = minTextSize;
    minTextSlider.value = minTextSize;
    minTextSlider.disabled = false;
    document.getElementById('min-text-size-value').textContent = `${minTextSize}px`;
    
    // Set up minimum button size slider
    const minButtonSlider = document.getElementById('min-button-size');
    minButtonSlider.min = minButtonSize;
    minButtonSlider.value = minButtonSize;
    minButtonSlider.disabled = false;
    document.getElementById('min-button-size-value').textContent = `${minButtonSize}px`;
}

// ===Basic Control Handlers===
async function handleMinTextSize(e) {
    const value = e.target.value;
    const minValue = e.target.min;
    document.getElementById('min-text-size-value').textContent = `${value}px`;
    
    try {
        if (!currentTab) await getCurrentTab();
        
        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'applyMinTextSize',
            value: parseInt(value),
            minValue: parseInt(minValue)
        });
    } catch (error) {
        console.error('Error applying min text size:', error);
    }
}

async function handleMinButtonSize(e) {
    const value = e.target.value;
    const minValue = e.target.min;
    document.getElementById('min-button-size-value').textContent = `${value}px`;
    
    try {
        if (!currentTab) await getCurrentTab();
        
        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'applyMinButtonSize',
            value: parseInt(value),
            minValue: parseInt(minValue)
        });
    } catch (error) {
        console.error('Error applying min button size:', error);
    }
}

async function handleTextContrast(value) {
    try {
        if (!currentTab) await getCurrentTab();
        
        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'applyTextContrast',
            value: value
        });
    } catch (error) {
        console.error('Error applying text contrast:', error);
    }
}

async function handleSpacing(value) {
    try {
        if (!currentTab) await getCurrentTab();
        
        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'applySpacing',
            value: value
        });
    } catch (error) {
        console.error('Error applying spacing:', error);
    }
}

function toggleAdvancedMode() {
    const advancedMode = document.getElementById('advanced-mode');
    advancedMode.classList.toggle('collapsed');
}

function resetButtonGroup(groupId) {
    const group = document.getElementById(groupId);
    const buttons = group.querySelectorAll('.option-btn');
    buttons.forEach((btn, index) => {
        if (index === 0) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ===Utility Functions===
function getTotalAttributeCount(attributes) {
    return Object.values(attributes).reduce((sum, arr) => sum + arr.length, 0);
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    //Hide success messaes automatically
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}

function setButtonLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ===== Color Picker =====
function openColorPicker(type, originalColor, elementIds, previewElement, itemElement) {
    // Get the current color from tracked changes or use original
    const changeKey = getChangeKey(type, elementIds);
    const change = appliedChanges.get(changeKey);
    const currentColor = change ? change.currentValue : originalColor;
    
    // Create a hidden color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = rgbToHex(currentColor);
    
    colorInput.onchange = async (e) => {
      const newColor = e.target.value;
      
      try {
        if (!currentTab) {
          await getCurrentTab();
        }
        
        await chrome.tabs.sendMessage(currentTab.id, {
          action: 'applyChange',
          attributeType: type,
          oldValue: currentColor,
          newValue: newColor,
          elementIds: elementIds
        });
        
        // Track the change
        appliedChanges.set(changeKey, {
            originalValue: originalColor,
            currentValue: newColor
        });
        
        // Update the preview
        previewElement.style.backgroundColor = newColor;
        
        // Update the UI to show the change
        updateItemDisplay(itemElement, originalColor, newColor);
        
      } catch (error) {
        console.error('Error applying color change:', error);
        showStatus('Error applying color change', 'error');
      }
    };
    
    // Trigger the color picker
    colorInput.click();
  }
  
  // Convert RGB to Hex for color picker
  function rgbToHex(rgb) {
    // Handle hex colors that are already in hex format
    if (rgb.startsWith('#')) {
      return rgb;
    }
    
    // Parse rgb(r, g, b) or rgba(r, g, b, a)
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) {
      return '#000000'; // Default to black if parsing fails
    }
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }