// 隐藏滚动条
document.documentElement.style.overflowY = "hidden";
document.documentElement.style.overflowX = "hidden";

// 初始化函数
window.initializeSvg = function () {
    const svgElement = document.getElementById('svg');
   
    // 等待所有路径元素加载完成
    setTimeout(() => {      
            initCars(svgElement);
            initGKs(svgElement);
            initGKs1(svgElement);
            initLogindesk(svgElement);
            initLogindesk1(svgElement);      
    }, 200);

    // 鼠标事件
    svgElement.addEventListener('wheel', handleWheelZoom);
    svgElement.addEventListener('mousedown', handleMouseDown);
};

// 小车初始化
function initCars(svg) {
    const path = document.querySelector('#myPath');
    if (!path) {
        console.error('Path #myPath not found');
        return;
    }

    const pathLength = path.getTotalLength();
    const numCars = 500; // 小车数量
    const carSpacing = pathLength / numCars;

    for (let i = 0; i < numCars; i++) {
        const carGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const car = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        car.setAttributeNS(null, 'class', 'car');
        car.setAttributeNS(null, 'width', '15');
        car.setAttributeNS(null, 'height', '30');
        car.setAttributeNS(null, 'fill', 'gray'); // 默认灰色

        const carLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        carLabel.setAttributeNS(null, 'class', 'car-label');
        carLabel.setAttributeNS(null, 'font-size', '8');
        carLabel.setAttributeNS(null, 'fill', 'white');
        carLabel.textContent = (i + 1).toString().padStart(3, '0');

        try {
            const point = path.getPointAtLength(i * carSpacing);
            const prevPoint = path.getPointAtLength(Math.max(0, (i - 1) * carSpacing));
            const tangentAngle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
            const rotation = tangentAngle * 180 / Math.PI;

            car.setAttributeNS(null, 'x', point.x - 15 / 2);
            car.setAttributeNS(null, 'y', point.y - 30 / 2);
            car.setAttributeNS(null, 'transform', `rotate(${rotation}, ${point.x}, ${point.y})`);
            car.setAttributeNS(null, 'id', `car${i + 1}`);

            carLabel.setAttributeNS(null, 'x', point.x - 4.5);
            carLabel.setAttributeNS(null, 'y', point.y - 4);
            carLabel.setAttributeNS(null, 'transform', `rotate(${rotation}, ${point.x}, ${point.y})`);

            carGroup.appendChild(car);
            carGroup.appendChild(carLabel);
            svg.appendChild(carGroup);
                     
        } catch (error) {
            console.error('Error creating car:', i, error);
        }
    }
}

// 格口初始化 (myPath1)
function initGKs(svg) {
    const path = document.querySelector('#myPath1');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numGKs = 28;
    const gkSpacing = pathLength / numGKs;

    for (let i = 0; i < numGKs; i++) {
        const gkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const gk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gk.setAttributeNS(null, 'class', 'gk');
        gk.setAttributeNS(null, 'width', '10');
        gk.setAttributeNS(null, 'height', '148');
        gk.setAttributeNS(null, 'fill', 'gray');

        const gkLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        gkLabel.setAttributeNS(null, 'class', 'gk-label');
        gkLabel.setAttributeNS(null, 'font-size', '8');
        gkLabel.setAttributeNS(null, 'fill', 'black');
        gkLabel.textContent = (i + 28).toString();

        try {
            const point = path.getPointAtLength(i * gkSpacing);

            gk.setAttributeNS(null, 'x', point.x - 10 / 2);
            gk.setAttributeNS(null, 'y', point.y - 148 / 2);
            gk.setAttributeNS(null, 'id', `gk${i + 28}`);

            gkLabel.setAttributeNS(null, 'x', point.x + 4);
            gkLabel.setAttributeNS(null, 'y', point.y - 2);

            gkGroup.appendChild(gk);
            gkGroup.appendChild(gkLabel);
            svg.appendChild(gkGroup);
        } catch (error) {
            console.error('Error creating GK:', i, error);
        }
    }
}

// 格口初始化 (myPath2)
function initGKs1(svg) {
    const path = document.querySelector('#myPath2');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numGKs1 = 27;
    const gkSpacing = pathLength / numGKs1;

    for (let i = 0; i < numGKs1; i++) {
        const gkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const gk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gk.setAttributeNS(null, 'class', 'gk');
        gk.setAttributeNS(null, 'width', '32');
        gk.setAttributeNS(null, 'height', '30');
        gk.setAttributeNS(null, 'fill', 'gray');

        const gkLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        gkLabel.setAttributeNS(null, 'class', 'gk-label');
        gkLabel.setAttributeNS(null, 'font-size', '8');
        gkLabel.setAttributeNS(null, 'fill', 'black');
        gkLabel.textContent = (i + 1).toString();

        try {
            const point = path.getPointAtLength(i * gkSpacing);

            gk.setAttributeNS(null, 'x', point.x - 32 / 2);
            gk.setAttributeNS(null, 'y', point.y - 30 / 2);
            gk.setAttributeNS(null, 'id', `gk${i + 1}`);

            gkLabel.setAttributeNS(null, 'x', point.x - 8);
            gkLabel.setAttributeNS(null, 'y', point.y - 2);

            gkGroup.appendChild(gk);
            gkGroup.appendChild(gkLabel);
            svg.appendChild(gkGroup);
        } catch (error) {
            console.error('Error creating GK1:', i, error);
        }
    }
}

function initLogindesk(svg) {
    const path = document.querySelector('#myPath3');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numGKs = 30;
    const gkSpacing = pathLength / numGKs;
    const num = [1, 4, 7, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21, 23, 24, 25, 27, 28, 29, 31, 32, 33, 35, 36, 38, 40, 42, 43];

    for (let i = 0; i < num.length && i < numGKs; i++) {
        const gkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const gk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gk.setAttributeNS(null, 'class', 'logindesk');
        gk.setAttributeNS(null, 'width', '10');
        gk.setAttributeNS(null, 'height', '20');
        gk.setAttributeNS(null, 'fill', 'lightgray');

        const gkLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        gkLabel.setAttributeNS(null, 'class', 'logindesk-label');
        gkLabel.setAttributeNS(null, 'font-size', '8');
        gkLabel.setAttributeNS(null, 'fill', 'black');
        gkLabel.textContent = num[i].toString();

        try {
            const point = path.getPointAtLength(i * gkSpacing);

            gk.setAttributeNS(null, 'x', point.x - 10 / 2);
            gk.setAttributeNS(null, 'y', point.y - 20 / 2);

            gkLabel.setAttributeNS(null, 'x', point.x + 4);
            gkLabel.setAttributeNS(null, 'y', point.y + 3);

            gkGroup.appendChild(gk);
            gkGroup.appendChild(gkLabel);
            svg.appendChild(gkGroup);
        } catch (error) {
            console.error('Error creating logindesk:', i, error);
        }
    }
}

function initLogindesk1(svg) {
    const path = document.querySelector('#myPath4');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numGKs = 31;
    const gkSpacing = pathLength / numGKs;
    const num = [99, 97, 95, 93, 92, 91, 89, 88, 87, 85, 84, 83, 81, 80, 79, 77, 76, 75, 73, 72, 71, 69, 68, 66, 64, 62, 60];

    for (let i = 0; i < num.length && i < numGKs; i++) {
        const gkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const gk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gk.setAttributeNS(null, 'class', 'logindesk');
        gk.setAttributeNS(null, 'width', '10');
        gk.setAttributeNS(null, 'height', '20');
        gk.setAttributeNS(null, 'fill', 'lightgray');

        const gkLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        gkLabel.setAttributeNS(null, 'class', 'logindesk-label');
        gkLabel.setAttributeNS(null, 'font-size', '8');
        gkLabel.setAttributeNS(null, 'fill', 'black');
        gkLabel.textContent = num[i].toString();

        try {
            const point = path.getPointAtLength(i * gkSpacing);

            gk.setAttributeNS(null, 'x', point.x - 10 / 2);
            gk.setAttributeNS(null, 'y', point.y - 20 / 2);

            gkLabel.setAttributeNS(null, 'x', point.x + 4);
            gkLabel.setAttributeNS(null, 'y', point.y + 3);

            gkGroup.appendChild(gk);
            gkGroup.appendChild(gkLabel);
            svg.appendChild(gkGroup);
        } catch (error) {
            console.error('Error creating logindesk1:', i, error);
        }
    }
}

// 鼠标事件处理
const state = {
    zoomLevel: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    startTranslateX: 0,
    startTranslateY: 0
};

function handleWheelZoom(event) {
    event.preventDefault();
    const zoomStep = 0.1;
    const minZoom = 0.5;
    const maxZoom = 3;

    if (event.deltaY < 0) {
        state.zoomLevel = Math.min(state.zoomLevel + zoomStep, maxZoom);
    } else {
        state.zoomLevel = Math.max(state.zoomLevel - zoomStep, minZoom);
    }
    updateTransform();
}

function handleMouseDown(event) {
    event.preventDefault();
    state.isDragging = true;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.startTranslateX = state.translateX;
    state.startTranslateY = state.translateY;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(event) {
    if (state.isDragging) {
        const dx = event.clientX - state.dragStartX;
        const dy = event.clientY - state.dragStartY;
        state.translateX = state.startTranslateX + dx;
        state.translateY = state.startTranslateY + dy;
        updateTransform();
    }
}

function handleMouseUp() {
    state.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

function updateTransform() {
    const svgElement = document.querySelector('svg');
    if (svgElement) {
        svgElement.style.transform = `scale(${state.zoomLevel}) translate(${state.translateX}px, ${state.translateY}px)`;
    }
}