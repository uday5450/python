const mainImageInput = document.getElementById('mainImage');
const logoImageInput = document.getElementById('logoImage');
const logoPositionSelect = document.getElementById('logoPosition');
const logoSizeInput = document.getElementById('logoSize');
const addressTextInput = document.getElementById('addressText');
const textPositionSelect = document.getElementById('textPosition');
const textColorInput = document.getElementById('textColor');
const textSizeInput = document.getElementById('textSize');
const deleteBtn = document.getElementById('deleteBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const placeholderText = document.getElementById('placeholderText');
const mainImageText = document.getElementById('mainImageText');
const logoImageText = document.getElementById('logoImageText');

let mainImg = null;
let logoImg = null;

let logoState = { x: 0, y: 0, w: 0, h: 0, isDragging: false, isHovered: false, custom: false };
let textState = { x: 0, y: 0, w: 0, h: 0, isDragging: false, isHovered: false, custom: false, text: '', color: '#ffffff', size: 0.03 };

let selectedElement = null; // 'logo' or 'text'
let dragStartX, dragStartY;

// Read file as Data URL
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Load Image from Data URL
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function handleMainImage(e) {
    if (e.target.files && e.target.files[0]) {
        try {
            const file = e.target.files[0];
            mainImageText.textContent = file.name;
            const src = await readFile(file);
            mainImg = await loadImage(src);
            canvas.style.display = 'block';
            placeholderText.style.display = 'none';
            downloadBtn.disabled = false;
            fullDraw(true);
        } catch (error) {
            console.error("Error loading main image:", error);
            alert("Failed to load image.");
        }
    }
}

async function handleLogoImage(e) {
    if (e.target.files && e.target.files[0]) {
        try {
            const file = e.target.files[0];
            logoImageText.textContent = file.name;
            const src = await readFile(file);
            logoImg = await loadImage(src);
            selectedElement = 'logo';
            updateSelectionUI();
            fullDraw(false);
        } catch (error) {
            console.error("Error loading logo image:", error);
            alert("Failed to load logo.");
        }
    }
}

function getCoordinates(position, elementWidth, elementHeight, canvasWidth, canvasHeight, padding) {
    let x = 0;
    let y = 0;

    switch (position) {
        case 'top-left':
            x = padding;
            y = padding;
            break;
        case 'top-right':
            x = canvasWidth - elementWidth - padding;
            y = padding;
            break;
        case 'bottom-left':
            x = padding;
            y = canvasHeight - elementHeight - padding;
            break;
        case 'bottom-right':
            x = canvasWidth - elementWidth - padding;
            y = canvasHeight - elementHeight - padding;
            break;
        case 'center':
            x = (canvasWidth - elementWidth) / 2;
            y = (canvasHeight - elementHeight) / 2;
            break;
    }
    return { x, y };
}

function updatePositions() {
    if (!mainImg) return;
    const padding = Math.max(canvas.width, canvas.height) * 0.03; // 3% padding

    if (logoImg) {
        const scale = parseFloat(logoSizeInput.value);
        const maxLogoDim = Math.max(canvas.width, canvas.height) * scale;
        
        let logoW = logoImg.width;
        let logoH = logoImg.height;
        
        const ratio = Math.min(maxLogoDim / logoW, maxLogoDim / logoH);
        logoState.w = logoW * ratio;
        logoState.h = logoH * ratio;

        if (!logoState.custom && logoPositionSelect.value !== 'custom') {
            const pos = getCoordinates(logoPositionSelect.value, logoState.w, logoState.h, canvas.width, canvas.height, padding);
            logoState.x = pos.x;
            logoState.y = pos.y;
        }
    }

    const text = addressTextInput.value.trim();
    textState.text = text;
    textState.color = textColorInput.value;
    textState.size = parseFloat(textSizeInput.value);

    if (text) {
        const fontSize = Math.max(canvas.width, canvas.height) * textState.size; 
        ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;

        const textMetrics = ctx.measureText(text);
        textState.w = textMetrics.width;
        textState.h = fontSize; 

        if (!textState.custom && textPositionSelect.value !== 'custom') {
            let pos = getCoordinates(textPositionSelect.value, textState.w, textState.h, canvas.width, canvas.height, padding);
            if (textPositionSelect.value.includes('bottom')) {
               pos.y -= textState.h * 0.2; 
            }
            textState.x = pos.x;
            textState.y = pos.y;
        }
    }
}

function drawBoundingBox(rect) {
    const padding = 6;
    const x = rect.x - padding;
    const y = rect.y - padding;
    const w = rect.w + padding * 2;
    const h = rect.h + padding * 2;

    // Draw dashed box
    ctx.strokeStyle = '#3b82f6'; // Blue color
    ctx.lineWidth = Math.max(2, canvas.width * 0.003);
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Draw corner handles
    const handleSize = Math.max(8, canvas.width * 0.01);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    const corners = [
        { cx: x, cy: y },
        { cx: x + w, cy: y },
        { cx: x, cy: y + h },
        { cx: x + w, cy: y + h }
    ];

    corners.forEach(corner => {
        ctx.fillRect(corner.cx - handleSize/2, corner.cy - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(corner.cx - handleSize/2, corner.cy - handleSize/2, handleSize, handleSize);
    });
}

function draw() {
    if (!mainImg) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw main image
    ctx.drawImage(mainImg, 0, 0);

    // Draw logo
    if (logoImg) {
        ctx.drawImage(logoImg, logoState.x, logoState.y, logoState.w, logoState.h);
        
        if (selectedElement === 'logo' || logoState.isHovered) {
            drawBoundingBox(logoState);
        }
    }

    // Draw text
    if (textState.text) {
        const fontSize = Math.max(canvas.width, canvas.height) * textState.size; 
        ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = textState.color;
        ctx.textBaseline = 'top';

        ctx.fillText(textState.text, textState.x, textState.y);
        ctx.shadowColor = 'transparent';

        if (selectedElement === 'text' || textState.isHovered) {
            drawBoundingBox(textState);
        }
    }
}

function fullDraw(resizeCanvas = false) {
    if (!mainImg) return;
    if (resizeCanvas) {
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;
    }
    updatePositions();
    draw();
}

function updateSelectionUI() {
    deleteBtn.disabled = !selectedElement;
}

function deleteSelectedElement() {
    if (selectedElement === 'logo') {
        logoImg = null;
        logoImageInput.value = '';
        logoImageText.textContent = "Drag & Drop or Click to Upload";
    } else if (selectedElement === 'text') {
        addressTextInput.value = '';
        textState.text = '';
    }
    selectedElement = null;
    updateSelectionUI();
    fullDraw();
}

// Mouse interaction for canvas
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function isInside(pos, rect, padding = 0) {
    return pos.x > rect.x - padding && 
           pos.x < rect.x + rect.w + padding && 
           pos.y > rect.y - padding && 
           pos.y < rect.y + rect.h + padding;
}

canvas.addEventListener('mousemove', (e) => {
    if (!mainImg) return;
    const mousePos = getMousePos(canvas, e);
    let needsRedraw = false;
    let hoveringSomething = false;

    if (logoState.isDragging) {
        logoState.x = mousePos.x - dragStartX;
        logoState.y = mousePos.y - dragStartY;
        needsRedraw = true;
    } else if (textState.isDragging) {
        textState.x = mousePos.x - dragStartX;
        textState.y = mousePos.y - dragStartY;
        needsRedraw = true;
    } else {
        const wasLogoHovered = logoState.isHovered;
        const wasTextHovered = textState.isHovered;

        logoState.isHovered = logoImg ? isInside(mousePos, logoState, 10) : false;
        textState.isHovered = textState.text ? isInside(mousePos, textState, 10) : false;

        // Prevent dual hover
        if (logoState.isHovered && textState.isHovered) {
            textState.isHovered = false;
        }

        if (wasLogoHovered !== logoState.isHovered || wasTextHovered !== textState.isHovered) {
            needsRedraw = true;
        }
        hoveringSomething = logoState.isHovered || textState.isHovered;
        canvas.style.cursor = hoveringSomething ? 'move' : 'default';
    }

    if (needsRedraw) draw();
});

canvas.addEventListener('mousedown', (e) => {
    if (!mainImg) return;
    const mousePos = getMousePos(canvas, e);
    
    let clickedElement = null;

    if (logoState.isHovered) {
        logoState.isDragging = true;
        logoState.custom = true;
        logoPositionSelect.value = 'custom';
        dragStartX = mousePos.x - logoState.x;
        dragStartY = mousePos.y - logoState.y;
        clickedElement = 'logo';
    } else if (textState.isHovered) {
        textState.isDragging = true;
        textState.custom = true;
        textPositionSelect.value = 'custom';
        dragStartX = mousePos.x - textState.x;
        dragStartY = mousePos.y - textState.y;
        clickedElement = 'text';
    }

    if (clickedElement !== selectedElement) {
        selectedElement = clickedElement;
        updateSelectionUI();
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    logoState.isDragging = false;
    textState.isDragging = false;
    draw(); 
});

canvas.addEventListener('mouseleave', () => {
    logoState.isDragging = false;
    textState.isDragging = false;
    logoState.isHovered = false;
    textState.isHovered = false;
    canvas.style.cursor = 'default';
    draw();
});

// Keyboard Delete
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        // Only delete if we are not actively typing in an input
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            deleteSelectedElement();
        }
    }
});

function downloadImage() {
    if (!mainImg) return;
    
    // Temporarily remove highlights for clean download
    logoState.isHovered = false;
    textState.isHovered = false;
    const tempSelected = selectedElement;
    selectedElement = null;
    draw();

    const link = document.createElement('a');
    link.download = 'brandmark-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Restore state
    selectedElement = tempSelected;
    draw();
}

// Event Listeners
mainImageInput.addEventListener('change', handleMainImage);
logoImageInput.addEventListener('change', handleLogoImage);

logoPositionSelect.addEventListener('change', () => {
    if (logoPositionSelect.value !== 'custom') logoState.custom = false;
    fullDraw(false);
});

textPositionSelect.addEventListener('change', () => {
    if (textPositionSelect.value !== 'custom') textState.custom = false;
    fullDraw(false);
});

logoSizeInput.addEventListener('input', () => fullDraw(false));
addressTextInput.addEventListener('input', () => {
    selectedElement = 'text';
    updateSelectionUI();
    fullDraw(false);
});
textColorInput.addEventListener('input', () => fullDraw(false));
textSizeInput.addEventListener('input', () => fullDraw(false));
deleteBtn.addEventListener('click', deleteSelectedElement);
downloadBtn.addEventListener('click', downloadImage);

// Drag and drop visual feedback for inputs
document.querySelectorAll('.drop-zone').forEach(dropZone => {
    const input = dropZone.querySelector('input[type="file"]');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            input.files = files;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    }, false);
});
