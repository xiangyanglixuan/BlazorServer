// 隐藏滚动条
document.documentElement.style.overflowY = "hidden";
document.documentElement.style.overflowX = "hidden";

// ------------------- 设备状态管理 -------------------
const deviceStatusMap = new Map();
let updateInterval = null;

// 获取状态对应的颜色
function getStatusColor(status) {
    const colorMap = {
        '待機': '#808080',
        '運行': '#4caf50',
        '故障': '#f44336',
        '掉綫': '#000000',
        '急停': '#ffc107',
        '鎖車': '#ff9800',
        '休眠': '#f48fb1',
        '鎖格': '#2196f3',
        '滿格': '#9c27b0',
        '堵包': '#00bcd4',
        '本地': '#ffffff',
        '超邊': '#795548'
    };
    return colorMap[status] || '#808080';
}

// 初始化模拟设备状态
function initMockDeviceStatus() {
    // 小车: 500辆
    for (let i = 1; i <= 500; i++) {
        const statusList = ['待機', '運行', '故障', '掉綫', '急停', '鎖車', '休眠'];
        let status = statusList[Math.floor(Math.random() * statusList.length)];
        if (Math.random() > 0.85) status = '待機';
        if (Math.random() > 0.92) status = '運行';
        deviceStatusMap.set(`car${i}`, {
            type: '小车',
            id: `CAR-${i.toString().padStart(3, '0')}`,
            status: status,
            detail: getStatusDetail(status),
            lastUpdate: new Date().toLocaleTimeString()
        });
    }

    // 格口 (1-55)
    for (let i = 1; i <= 55; i++) {
        const statusList = ['待機', '鎖格', '滿格', '堵包', '故障'];
        let status = statusList[Math.floor(Math.random() * statusList.length)];
        if (Math.random() > 0.7) status = '待機';
        deviceStatusMap.set(`gk${i}`, {
            type: '格口',
            id: `GK-${i.toString().padStart(2, '0')}`,
            status: status,
            detail: getStatusDetail(status),
            lastUpdate: new Date().toLocaleTimeString()
        });
    }
}

function getStatusDetail(status) {
    const details = {
        '待機': '设备空闲，等待任务指令',
        '運行': '正在执行搬运任务',
        '故障': '设备故障，需要维修处理',
        '掉綫': '网络连接中断，检查通讯',
        '急停': '紧急停止按钮被按下',
        '鎖車': '小车被系统锁定',
        '鎖格': '格口被锁定不可用',
        '滿格': '格口已满，等待清空',
        '堵包': '包裹堵塞，需要清理',
        '休眠': '低功耗节能模式',
        '本地': '本地手动控制模式'
    };
    return details[status] || '状态正常';
}

// 随机更新部分设备状态（模拟实时变化）
function randomUpdateStatus() {
    const allDevices = Array.from(deviceStatusMap.keys());
    const updateCount = Math.min(15, allDevices.length);

    for (let i = 0; i < updateCount; i++) {
        const randomIndex = Math.floor(Math.random() * allDevices.length);
        const deviceKey = allDevices[randomIndex];
        const device = deviceStatusMap.get(deviceKey);

        if (device) {
            let newStatus = device.status;
            const random = Math.random();

            // 状态变化逻辑
            if (device.status === '待機') {
                if (random < 0.1) newStatus = '運行';
                else if (random < 0.12) newStatus = '故障';
            } else if (device.status === '運行') {
                if (random < 0.15) newStatus = '待機';
                else if (random < 0.18) newStatus = '故障';
            } else if (device.status === '故障') {
                if (random < 0.3) newStatus = '待機';
            } else if (device.status === '掉綫') {
                if (random < 0.4) newStatus = '待機';
            } else if (device.status === '鎖格' || device.status === '滿格') {
                if (random < 0.2) newStatus = '待機';
            } else if (device.status === '堵包') {
                if (random < 0.25) newStatus = '待機';
            }

            if (newStatus !== device.status) {
                device.status = newStatus;
                device.detail = getStatusDetail(newStatus);
                device.lastUpdate = new Date().toLocaleTimeString();
                device.lastUpdate = new Date().toLocaleTimeString();
                deviceStatusMap.set(deviceKey, device);

                // 更新SVG中对应设备的颜色
                updateDeviceColor(deviceKey, newStatus);
            }
        }
    }
}

// 更新设备颜色
function updateDeviceColor(deviceId, status) {
    const color = getStatusColor(status);
    const element = document.getElementById(deviceId);
    if (element) {
        element.setAttribute('fill', color);
    }
}

// 创建悬浮提示框
let tooltipDiv = null;
function ensureTooltip() {
    if (!tooltipDiv) {
        tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'device-tooltip';
        tooltipDiv.style.display = 'none';
        document.body.appendChild(tooltipDiv);
    }
    return tooltipDiv;
}

function showDeviceTooltip(deviceId, event) {
    const data = deviceStatusMap.get(deviceId);
    if (!data) return;

    const tooltip = ensureTooltip();
    const statusColor = getStatusColor(data.status);
    tooltip.innerHTML = `
        <strong>📦 ${data.type}</strong> &nbsp; ${data.id}<br/>
        <span style="color: #aaa;">状态:</span> 
        <span class="tooltip-status" style="color: ${statusColor}; font-weight: bold;">${data.status}</span><br/>
        <span style="color: #aaa;">详情:</span> ${data.detail}<hr/>
        <span style="color: #aaa; font-size: 11px;">⏱️ 更新: ${data.lastUpdate}</span>
    `;
    tooltip.style.display = 'block';

    let left = event.clientX + 15;
    let top = event.clientY - 35;
    if (left + 220 > window.innerWidth) left = event.clientX - 240;
    if (top + 120 > window.innerHeight) top = event.clientY - 100;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function hideDeviceTooltip() {
    if (tooltipDiv) {
        tooltipDiv.style.display = 'none';
    }
}

function bindTooltipEvents(element, deviceId) {
    if (!element) return;
    element.addEventListener('mouseenter', (e) => {
        showDeviceTooltip(deviceId, e);
    });
    element.addEventListener('mouseleave', () => {
        hideDeviceTooltip();
    });
}

// 统一绑定所有设备事件
function bindAllDeviceTooltips() {
    for (let i = 1; i <= 500; i++) {
        const car = document.getElementById(`car${i}`);
        if (car) bindTooltipEvents(car, `car${i}`);
    }
    for (let i = 1; i <= 55; i++) {
        const gk = document.getElementById(`gk${i}`);
        if (gk) bindTooltipEvents(gk, `gk${i}`);
    }
}

// 初始化SVG设备
function initCars(svg) {
    const path = document.querySelector('#myPath');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numCars = 500;
    const carSpacing = pathLength / numCars;

    for (let i = 0; i < numCars; i++) {
        const carGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const car = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        car.setAttributeNS(null, 'class', 'car');
        car.setAttributeNS(null, 'width', '15');
        car.setAttributeNS(null, 'height', '30');

        const statusData = deviceStatusMap.get(`car${i + 1}`);
        const fillColor = getStatusColor(statusData ? statusData.status : '待機');
        car.setAttributeNS(null, 'fill', fillColor);
        car.setAttributeNS(null, 'rx', '3');
        car.setAttributeNS(null, 'ry', '3');

        const carLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        carLabel.setAttributeNS(null, 'class', 'car-label');
        carLabel.textContent = (i + 1).toString().padStart(3, '0');

        try {
            const point = path.getPointAtLength(i * carSpacing);
            const prevPoint = path.getPointAtLength(Math.max(0, (i - 1) * carSpacing));
            const tangentAngle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
            const rotation = tangentAngle * 180 / Math.PI;

            car.setAttributeNS(null, 'x', point.x - 7.5);
            car.setAttributeNS(null, 'y', point.y - 15);
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

function initGKs(svg) {
    const path = document.querySelector('#myPath1');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numGKs = 28;
    const gkSpacing = pathLength / numGKs;

    for (let i = 0; i < numGKs; i++) {
        const gkNumber = i + 28;
        const gk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gk.setAttributeNS(null, 'class', 'gk');
        gk.setAttributeNS(null, 'width', '10');
        gk.setAttributeNS(null, 'height', '148');

        const statusData = deviceStatusMap.get(`gk${gkNumber}`);
        const fillColor = getStatusColor(statusData ? statusData.status : '待機');
        gk.setAttributeNS(null, 'fill', fillColor);

        const gkLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        gkLabel.setAttributeNS(null, 'class', 'gk-label');
        gkLabel.textContent = gkNumber.toString();

        try {
            const point = path.getPointAtLength(i * gkSpacing);
            gk.setAttributeNS(null, 'x', point.x - 5);
            gk.setAttributeNS(null, 'y', point.y - 74);
            gk.setAttributeNS(null, 'id', `gk${gkNumber}`);
            gkLabel.setAttributeNS(null, 'x', point.x + 4);
            gkLabel.setAttributeNS(null, 'y', point.y - 2);

            svg.appendChild(gk);
            svg.appendChild(gkLabel);
        } catch (error) {
            console.error('Error creating GK:', i, error);
        }
    }
}

function initGKs1(svg) {
    const path = document.querySelector('#myPath2');
    if (!path) return;

    const pathLength = path.getTotalLength();
    const numGKs1 = 27;
    const gkSpacing = pathLength / numGKs1;

    for (let i = 0; i < numGKs1; i++) {
        const gkNumber = i + 1;
        const gk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gk.setAttributeNS(null, 'class', 'gk');
        gk.setAttributeNS(null, 'width', '32');
        gk.setAttributeNS(null, 'height', '30');

        const statusData = deviceStatusMap.get(`gk${gkNumber}`);
        const fillColor = getStatusColor(statusData ? statusData.status : '待機');
        gk.setAttributeNS(null, 'fill', fillColor);

        const gkLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        gkLabel.setAttributeNS(null, 'class', 'gk-label');
        gkLabel.textContent = gkNumber.toString();

        try {
            const point = path.getPointAtLength(i * gkSpacing);
            gk.setAttributeNS(null, 'x', point.x - 16);
            gk.setAttributeNS(null, 'y', point.y - 15);
            gk.setAttributeNS(null, 'id', `gk${gkNumber}`);
            gkLabel.setAttributeNS(null, 'x', point.x - 8);
            gkLabel.setAttributeNS(null, 'y', point.y - 2);

            svg.appendChild(gk);
            svg.appendChild(gkLabel);
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

// 启动状态定时更新
function startStatusUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        randomUpdateStatus();
    }, 3000);
}

// 主初始化函数
window.initializeSvg = function () {
    initMockDeviceStatus();
    startStatusUpdate();
    const svgElement = document.getElementById('svg');

    setTimeout(() => {
        initCars(svgElement);
        initGKs(svgElement);
        initGKs1(svgElement);
        initLogindesk(svgElement);
        initLogindesk1(svgElement);

        bindAllDeviceTooltips();
      
    }, 200);

    svgElement.addEventListener('wheel', handleWheelZoom);
    svgElement.addEventListener('mousedown', handleMouseDown);
};

// 鼠标缩放拖拽
const state = {
    zoomLevel: 0.7,
    translateX: -30,
    translateY: -52,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    startTranslateX: 0,
    startTranslateY: 0
};

function handleWheelZoom(event) {
    event.preventDefault();
    const zoomStep = 0.05;
    const minZoom = 0.4;
    const maxZoom = 2.5;

    if (event.deltaY < 0) {
        state.zoomLevel = Math.min(state.zoomLevel + zoomStep, maxZoom);
    } else {
        state.zoomLevel = Math.max(state.zoomLevel - zoomStep, minZoom);
    }
    updateTransform();
}

function handleMouseDown(event) {
    if (event.target.closest('svg') && !event.target.closest('.car') && !event.target.closest('.gk') && !event.target.closest('.logindesk')) {
        event.preventDefault();
        state.isDragging = true;
        state.dragStartX = event.clientX;
        state.dragStartY = event.clientY;
        state.startTranslateX = state.translateX;
        state.startTranslateY = state.translateY;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
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
    const svgElement = document.querySelector('#svg');
    if (svgElement) {
        svgElement.style.transform = `scale(${state.zoomLevel}) translate(${state.translateX}px, ${state.translateY}px)`;
    }
}