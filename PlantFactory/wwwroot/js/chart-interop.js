
// 存储图表实例
window.chartInstances = {};

// 创建图表
window.createChart = function (canvasId, labels, data, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 如果已有图表实例，先销毁
    if (window.chartInstances[canvasId]) {
        window.chartInstances[canvasId].destroy();
    }

    // 创建新图表
    window.chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: color.replace('0.8', '0.1'),
                borderColor: color,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    padding: 10
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    beginAtZero: false,
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
};

// 销毁图表
window.destroyChart = function (canvasId) {
    if (window.chartInstances[canvasId]) {
        window.chartInstances[canvasId].destroy();
        delete window.chartInstances[canvasId];
    }
};

// 更新图表数据
window.updateChart = function (canvasId, labels, data) {
    if (window.chartInstances[canvasId]) {
        const chart = window.chartInstances[canvasId];
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    }
};