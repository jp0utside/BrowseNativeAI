// ===State Management===
let currentAttributes = null;
let currentTab = null;

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

        currentAttributes = response.attributes;
        displayAttributes(response.attributes);

        const totalCount = getTotalAttributeCount(response.attributes);
        showStatus(`Found ${totalCount} attribute groups`, 'success');

        document.getElementById('empty-state').style.display = 'none';

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

        //Hide attributes and show empty state
        document.getElementById('attributes-panel').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';

        currentAttributes = null;

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
    //Show the attribute panel
    document.getElementById('attributes-panel').style.display = 'flex';
    
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
        const itemEl = createAttributeItem({
            value: item.value,
            count: item.value,
            elementIds: item.elementIds,
            type: attributeType,
            controls: controlType
        });
        listContainer.appendChild(itemEl);
    });
}

// ===Create Attribute Item===
function createAttributeItem(config) {
    const { value, count, elementIds, type, controls } = config;

    const item = document.createElement('div');
    item.className = 'attribute-item';

    //Color preview for colors and background
    if (controls == 'colorPreview') {
        const preview = document.createElement('div');
        preview.className = 'color-preview';
        preview.style.backgroundColor = value;
        preview.title = 'Click to change color';

        //Click handler
        preview.onclick = (e) => {
            e.stopPropagation();
            openColorPicker(type, value, elementIds, preview);
        };

        item.appendChild(preview);
    }

    //Info section
    const info = document.createElement('div');
    info.className = 'attribute-info';

    const valueEl = document.createElement('div');
    valueEl.className = 'attribute-value';
    valueEl.textContent = value;
    valueEl.title = value; //Setting this so hover reveals full value

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
        minusBtn.titleContent = '-';
        minusBtn.title = 'Decrease';

        minusBtn.onclick = (e) => {
            e.stopPropagation;
            adjustAttribute(type, value, elementIds, -1);
        };

        const plusBtn = document.createElement('button');
        plusBtn.className = 'control-btn';
        plusBtn.titleContent = '+';
        plusBtn.title = 'Increase';

        plusBtn.onclick = (e) => {
            e.stopPropagation;
            adjustAttribute(type, value, elementIds, 1);
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
async function adjustAttribute(type, oldValue, elementIds, direction) {
    const newValue = calculateNewValue(type, oldValue, direction);

    try {
        if (!currentTab) {
            await getCurrentTab();
        }

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'applyChange',
            attributeType: type,
            oldValue: oldValue,
            newValue: newValue,
            elementIds: elementIds
        });

    } catch (error) {
        console.error('Error applying changes: ', error);
        showStatus('Error applying changes', 'error');
    }
}

function calculateNewValue(type, oldValue, direction) {
    if (type === 'font-size') {
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
function openColorPicker(type, currentColor, elementIds, previewElement) {
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
        
        // Update the preview
        previewElement.style.backgroundColor = newColor;
        
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