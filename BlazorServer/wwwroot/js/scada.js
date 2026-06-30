// ==========================================
// SCADA 监控 - 整合模块
// SVG 流程图 + 状态轮询 + 报警/事件
// ==========================================

(function () {
    'use strict';

    var svg = null;
    var activeSvgs = [];
    var pollIntervals = [];

    // ============================================================
    // 工具函数 路线绘制
    // ============================================================
    function dist(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function sampleAtDistance(points, targetDist) {
        var walked = 0;
        for (var i = 0; i < points.length - 1; i++) {
            var p1 = points[i], p2 = points[i + 1];
            var segLen = dist(p1.x, p1.y, p2.x, p2.y);
            if (walked + segLen >= targetDist) {
                var t = (targetDist - walked) / segLen;
                return {
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t,
                    angle: Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
                };
            }
            walked += segLen;
        }
        var last = points[points.length - 1];
        return { x: last.x, y: last.y, angle: 0 };
    }

    function autoSplitLine(points, labels, gap) {
        if (gap === undefined) gap = 8;
        var totalLen = 0;
        for (var i = 0; i < points.length - 1; i++) {
            totalLen += dist(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }
        var gapTotal = gap * (labels.length - 1);
        var effectiveLen = (totalLen - gapTotal) / labels.length;
        if (effectiveLen <= 0) effectiveLen = 1;

        var segments = [];
        for (var j = 0; j < labels.length; j++) {
            var startDist = effectiveLen * j + gap * j;
            var endDist   = effectiveLen * (j + 1) + gap * j;
            var start = sampleAtDistance(points, startDist);
            var end   = sampleAtDistance(points, endDist);
            var d = 'M' + start.x.toFixed(0) + ' ' + start.y.toFixed(0)
                  + ' L' + end.x.toFixed(0) + ' ' + end.y.toFixed(0);
            segments.push({
                d: d,
                label: labels[j],
                midX: (start.x + end.x) / 2,
                midY: (start.y + end.y) / 2,
                angle: start.angle
            });
        }
        return segments;
    }

    function customSplitLine(points, segmentLabels, gap) {
        if (gap === undefined) gap = 8;

        var allSegments = [];
        for (var s = 0; s < segmentLabels.length; s++) {
            var labels = segmentLabels[s];
            var p1 = points[s], p2 = points[s + 1];
            if (!labels.length) continue;

            var segLen = dist(p1.x, p1.y, p2.x, p2.y);
            var gapTotal = gap * (labels.length - 1);
            var effectiveLen = (segLen - gapTotal) / labels.length;
            if (effectiveLen <= 0) effectiveLen = 1;

            for (var j = 0; j < labels.length; j++) {
                var t1 = (effectiveLen * j + gap * j) / segLen;
                var t2 = (effectiveLen * (j + 1) + gap * j) / segLen;

                var sx = p1.x + (p2.x - p1.x) * t1;
                var sy = p1.y + (p2.y - p1.y) * t1;
                var ex = p1.x + (p2.x - p1.x) * t2;
                var ey = p1.y + (p2.y - p1.y) * t2;
                var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

                allSegments.push({
                    d: 'M' + sx.toFixed(0) + ' ' + sy.toFixed(0) + ' L' + ex.toFixed(0) + ' ' + ey.toFixed(0),
                    label: labels[j],
                    midX: (sx + ex) / 2,
                    midY: (sy + ey) / 2,
                    angle: angle
                });
            }
        }
        return allSegments;
    }

    function drawRoute(points, color) {
        if (color === undefined) color = 'red';
        for (var i = 0; i < points.length - 1; i++) {
            var p1 = points[i], p2 = points[i + 1];
            var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var d = 'M' + p1.x.toFixed(0) + ' ' + p1.y.toFixed(0) + ' L' + p2.x.toFixed(0) + ' ' + p2.y.toFixed(0);
            pathEl.setAttribute('d', d);
            pathEl.setAttribute('stroke', color);
            pathEl.setAttribute('stroke-width', '2');
            pathEl.setAttribute('fill', 'none');
            pathEl.setAttribute('stroke-dasharray', '6,4');
            svg.appendChild(pathEl);
        }
    }

    function renderSegments(segments, className, textClassName, rotateText, labelDx, labelDy) {
        if (labelDx === undefined) labelDx = 2;
        if (labelDy === undefined) labelDy = 2;
        segments.forEach(function (seg) {
            var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', seg.d);
            pathEl.setAttribute('class', className + ' path-clickable');
            pathEl.setAttribute('id', seg.label);
            pathEl.setAttribute('name', seg.label);
            svg.appendChild(pathEl);

            var lx = seg.midX + labelDx;
            var ly = seg.midY + labelDy;

            var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('class', textClassName + ' label-clickable');
            textEl.setAttribute('data-for', seg.label);
            textEl.textContent = seg.label;
            textEl.setAttribute('x', lx);
            textEl.setAttribute('y', ly);

            if (rotateText) {
                textEl.setAttribute('transform',
                    'rotate(-90 ' + lx + ' ' + ly + ')');
                textEl.setAttribute('text-anchor', 'middle');
                textEl.setAttribute('dominant-baseline', 'middle');
            }
            svg.appendChild(textEl);
        });
    }

    function createPathWithLabel(pathData, labels, className, textClassName, rotateText) {
        pathData.forEach(function (path, index) {
            var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', path);
            pathEl.setAttribute('class', className + ' path-clickable');
            pathEl.setAttribute('name', labels[index]);
            svg.appendChild(pathEl);

            var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('class', textClassName + ' label-clickable');
            textEl.setAttribute('data-for', labels[index]);
            textEl.textContent = labels[index];

            var pathLength = pathEl.getTotalLength();
            var midPoint = pathEl.getPointAtLength(pathLength / 2);
            textEl.setAttribute('x', midPoint.x + 2);
            textEl.setAttribute('y', midPoint.y + 2);

            if (rotateText) {
                textEl.setAttribute('transform',
                    'rotate(-90 ' + (midPoint.x + 2) + ' ' + (midPoint.y + 2) + ')');
                textEl.setAttribute('text-anchor', 'middle');
                textEl.setAttribute('dominant-baseline', 'middle');
            }
            svg.appendChild(textEl);
        });
    }

    // ============================================================
    // SVG 流程图绘制
    // ============================================================
    function initSvgFlow(svgId) {
        svg = document.getElementById(svgId);
        if (!svg) return false;

        // 清除旧元素
        // ['line','gbt','ng','nggbt','motor','collisionmotor','blun','zhix','emg','scan','safetydoor','aconveyorline-label','collisionmotor-label']
        //     .forEach(function (cls) {
        //         svg.querySelectorAll('.' + cls).forEach(function (el) { el.remove(); });
        //     });

        //DDK
        drawDdkLine(svg);

        //KK
        drawKkLine(svg);

        //HK
        drawHkLine(svg);

        initPopupEvents(svg);
        // 移除同 prefix 的旧条目, 防止切标签时重复累加
        activeSvgs = activeSvgs.filter(function (e) { return e.badgePrefix !== ''; });
        activeSvgs.push({ svg: svg, badgePrefix: '' });
        console.log('SCADA SVG 流程图已初始化');
        return true;
    }

    function drawDdkLine(svg) {
        var ddkPoints = [
            {x:120,y:220},{x:1280,y:220},{x:1306,y:182},{x:1306,y:30},
            {x:1294,y:30},{x:650,y:30},{x:650,y:42},{x:650,y:180},
            {x:650,y:42},{x:1020,y:42},{x:1020,y:180},{x:1020,y:42},
            {x:1294,y:100},{x:1164,y:100}
        ];
        renderSegments(customSplitLine(ddkPoints,
            [
                ['DDK01','DDK02','DDK03','DDK04','DDK05','DDK05-1','DDK05-2','DDK06','DDK07','DDK07-1','DDK07-2',
                 'DDK08','DDK09','DDK09-1','DDK09-2','DDK10','DDK11','DDK11-1','DDK12','DDK13','DDK14','DDK14-1','DDK14-2','DDK15',
                 'DDK16','DDK17','DDK18','DDK19','DDK20','DDK21','DDK22'],
                [],
                ['DDK24','DDK25','DDK26','DDK27','DDK28','DDK33','DDK34-1','DDK34-2'],
                [],
                ['DDK35','DDK36','DDK37','DDK38','DDK39','DDK40','DDK41','DDK42','DDK43','DDK44','DDK45','DDK46','DDK47'],
                [],
                ['DDK54','DDK55','DDK56','DDK57','DDK58','DDK59'],
                [],
                [],
                ['DDK48','DDK49','DDK50','DDK51','DDK52','DDK53'],
                [],
                [],
                ['DDK29','DDK30','DDK31']
            ]
        ),'line','aconveyorline-label',false,-10,2);

        createPathWithLabel([
            "M1288 220 A20 20 0 0 0 1298 212",
            "M1302 204 A20 20 0 0 0 1306 188"
        ], ['DDK23-1','DDK23-2'], 'line', 'aconveyorline-label', false,-10,0);
    }

    function drawKkLine(svg) {
        var kkPoints = [
            {x:1294,y:60},{x:1134,y:60},{x:1134,y:150},
            {x:994,y:150},{x:994,y:190},{x:270,y:190},{x:270,y:40}
        ];
        drawRoute(kkPoints, '#44ff44');
        renderSegments(customSplitLine(kkPoints,
            [
                ['KK01','KK02','KK03-1','KK03-2'],
                ['KK04','KK05-1','KK05-2'],
                ['KK06','KK07-1','KK07-2'],
                ['KK08'],
                ['KK09-1','KK09-2','KK10','KK11','KK12','KK13','KK14','KK15','KK16',
                 'KK17','KK18','KK19','KK20','KK21','KK22','KK23','KK24','KK25','KK26',
                 'KK27','KK28','KK29','KK30'],
                ['KK31-1','KK31-2','KK31-3','KK31-4','KK31-5','KK31-6','KK31-7','KK31-8']
            ]
        ), 'line', 'aconveyorline-label', false, -10, 2);
    }

    function drawHkLine(svg) {
        var hkPoints = [
            { x: 120, y: 270 },
            { x: 120, y: 360 },
            { x: 250, y: 240 },
            { x: 250, y: 360 },
            { x: 380, y: 240 },
            { x: 380, y: 360 },
            { x: 510, y: 240 },
            { x: 510, y: 360 },
            { x: 640, y: 240 },
            { x: 640, y: 360 },
            { x: 770, y: 240 },
            { x: 770, y: 360 },
            { x: 900, y: 240 },
            { x: 900, y: 360 },
            { x: 1030, y: 240 },
            { x: 1030, y: 360 },
            { x: 1160, y: 240 },
            { x: 1160, y: 360 },
            { x: 1320, y: 360 },
            { x: 1320, y: 240 },
            { x: 1250, y: 240 },
            { x: 110, y: 370 },
            { x: 1420, y: 370 },
            { x: 1420, y: 260 },
            { x: 1480, y: 260 },
            { x: 1480, y: 460 },
            { x: 900, y: 460 },
            { x: 900, y: 600 },
            { x: 1500, y: 600 },
            { x: 1500, y: 1350 },
            { x: 1000, y: 1350 },
            { x: 1000, y: 1100 },
            { x: 900, y: 1100 },
            { x: 1300, y: 590 },
            { x: 1300, y: 500 },
            { x: 1530, y: 500 },
            { x: 1530, y: 1350 }
        ];
        drawRoute(hkPoints, '#44ff44');
        renderSegments(customSplitLine(hkPoints, [
            ['HK01', 'HK02', 'HK03'],
            [],
            ['HK04', 'HK05', 'HK06', 'HK07', 'HK08'],
            [],
            ['HK09', 'HK10', 'HK11', 'HK12', 'HK13'],
            [],
            ['HK14', 'HK15', 'HK16', 'HK17', 'HK18'],
            [],
            ['HK19', 'HK20', 'HK21', 'HK22', 'HK23'],
            [],
            ['HK24', 'HK25', 'HK26', 'HK27', 'HK28'],
            [],
            ['HK29', 'HK30', 'HK31', 'HK32', 'HK33'],
            [],
            ['HK34', 'HK35', 'HK36', 'HK37', 'HK38'],
            [],
            ['HK39', 'HK40', 'HK41', 'HK42', 'HK43'],
            [],
            ['HK84', 'HK85', 'HK86', 'HK87', 'HK88'],
            ['HK89', 'HK90', 'HK91'],
            [],
            ['HK44', 'HK45', 'HK46', 'HK47', 'HK48', 'HK49', 'HK50', 'HK51', 'HK52', 'HK53', 'HK54', 'HK55', 'HK56', 'HK57', 'HK58', 'HK59',
                'HK60', 'HK61', 'HK62', 'HK63', 'HK64', 'HK65', 'HK66', 'HK67', 'HK68', 'HK69', 'HK70', 'HK71', 'HK72', 'HK73', 'HK74', 'HK75',
                'HK76', 'HK77', 'HK80', 'HK81', 'HK82', 'HK83', 'HK92', 'HK92A', 'HK93-1'
            ],
            ['HK93-2', 'HK94', 'HK95-1'],
            ['HK95-2', 'HK96-1'],
            ['HK96-2', 'HK97', 'HK98', 'HK99', 'HK100', 'HK101', 'HK102', 'HK103'],
            ['HK104-1', 'HK104-2', 'HK105', 'HK106', 'HK107', 'HK108-1', 'HK108-2'],
            ['HK109', 'HK110', 'HK111', 'HK112', 'HK113'],
            ['HK114-1', 'HK114-2', 'HK115', 'HK116', 'HK117', 'HK118', 'HK119', 'HK120', 'HK121', 'HK122', 'HK123', 'HK124', 'HK125', 'HK126', 'HK127',
                'HK128', 'HK129', 'HK130-1', 'HK130-2'
            ],
            ['HK204', 'HK205', 'HK206', 'HK207', 'HK208', 'HK209', 'HK210', 'HK211', 'HK212', 'HK213', 'HK214', 'HK215', 'HK216', 'HK217', 'HK218', 'HK219',
                'HK220', 'HK221', 'HK222', 'HK223', 'HK224', 'HK225', 'HK226', 'HK227', 'HK228', 'HK229', 'HK230', 'HK231', 'HK232', 'HK233', 'HK234', 'HK235',
                'HK236', 'HK237', 'HK238', 'HK239', 'HK240', 'HK241', 'HK242', 'HK243', 'HK244', 'HK245', 'HK246', 'HK247', 'HK248', 'HK249', 'HK250', 'HK251',
                'HK252', 'HK253', 'HK254', 'HK255', 'HK256', 'HK257', 'HK258', 'HK259', 'HK260', 'HK261', 'HK262', 'HK263', 'HK264', 'HK265', 'HK266'
            ],
            ['HK267', 'HK268', 'HK269', 'HK270', 'HK271', 'HK272', 'HK273', 'HK274', 'HK275', 'HK276', 'HK277', 'HK278', 'HK279', 'HK280', 'HK281', 'HK282', 'HK283'],
            ['HK284', 'HK285', 'HK286', 'HK287', 'HK288'],
            ['HK289', 'HK290', 'HK291', 'HK292', 'HK293'],
            [],
            ['HK131', 'HK132'],
            ['HK133', 'HK134', 'HK135', 'HK136', 'HK137', 'HK138-1', 'HK138-2'],
            ['HK139', 'HK140', 'HK141', 'HK142', 'HK143', 'HK144', 'HK145', 'HK146', 'HK147', 'HK148', 'HK149', 'HK150', 'HK151', 'HK152', 'HK153', 'HK154',
                'HK155', 'HK156', 'HK157', 'HK158', 'HK159', 'HK160', 'HK161', 'HK162', 'HK163', 'HK164', 'HK165', 'HK166', 'HK167', 'HK168', 'HK169', 'HK170',
                'HK171', 'HK172', 'HK173', 'HK174', 'HK175', 'HK176', 'HK177', 'HK178', 'HK179', 'HK180', 'HK181', 'HK182', 'HK183', 'HK184', 'HK185', 'HK186',
                'HK187', 'HK188', 'HK189', 'HK190', 'HK191', 'HK192', 'HK193', 'HK194', 'HK195', 'HK196', 'HK197', 'HK198', 'HK199', 'HK200', 'HK201', 'HK202',
                'HK203'
            ]
        ]), 'line', 'aconveyorline-label', false, -8, 2);
    }

    // ============================================================
    // 状态轮询与更新
    // ============================================================
    var DEVICE_TYPES = [
        { prefix: 'DDK', url: '/Scada/status/DDK' },
        { prefix: 'KK',  url: '/Scada/status/KK'  },
        { prefix: 'HK',  url: '/Scada/status/HK'  },
    ];

    var applyStatusPrinted = {};

    function fetchStatus(cfg) {
        fetch(cfg.url)
            .then(function (resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                return resp.json();
            })
            .then(function (json) {
                console.log(cfg.prefix + ' 状态获取成功, 共' + json.data.length + '个设备');
                applyStatus(cfg.prefix, json.data);
            })
            .catch(function (err) {
                console.warn(cfg.prefix + ' 状态请求失败: ' + err.message);
            });
    }

    // 各线体中不存在的设备编号 (API 返回数据中包含, 但线体上无对应设备)
    var SKIP_NUMBERS = {
        'HK': [78, 79]
    };

    function applyStatus(prefix, statusArray) {
        if (!Array.isArray(statusArray)) return;
        if (!activeSvgs.length) return;

        activeSvgs.forEach(function (entry) {
            _applyStatusToSvg(entry.svg, prefix, statusArray);
        });
        updateBadgeCounts();
    }

    function _applyStatusToSvg(svg, prefix, statusArray) {
        var paths = svg.querySelectorAll('path[name]');

        // 按编号排序建立映射
        var re = new RegExp('^' + prefix + '(\\d+)([A-Z])?(?:-(\\d+))?$', 'i');
        var labels = [];
        for (var i = 0; i < paths.length; i++) {
            var n = paths[i].getAttribute('name');
            if (!n) continue;
            var m = n.match(re);
            if (!m) continue;
            labels.push({
                name: n.toUpperCase(),
                base: parseInt(m[1], 10),
                letter: m[2] || '',
                sub: m[3] ? parseInt(m[3], 10) : 0
            });
        }

        labels.sort(function (a, b) {
            if (a.base !== b.base) return a.base - b.base;
            if (a.letter !== b.letter) return a.letter < b.letter ? -1 : 1;
            return a.sub - b.sub;
        });

        // 跳过 API 中有但线体上不存在的设备编号
        var skips = SKIP_NUMBERS[prefix] || [];
        var labelIdx = {}, apiIdx = 0, skipPtr = 0;
        for (var i = 0; i < labels.length; i++) {
            if (labels[i].name in labelIdx) continue;
            while (skipPtr < skips.length) {
                var sn = skips[skipPtr];
                if (sn < labels[i].base || (sn === labels[i].base && (labels[i].letter || labels[i].sub !== 0))) {
                    apiIdx++;
                    skipPtr++;
                } else {
                    break;
                }
            }
            labelIdx[labels[i].name] = apiIdx++;
        }

        // 首次打印排序
        if (!applyStatusPrinted[prefix]) {
            applyStatusPrinted[prefix] = true;
            var names = [];
            for (var i = 0; i < labels.length; i++) {
                if (names.indexOf(labels[i].name) === -1) names.push(labels[i].name);
            }
            console.log(prefix + ' 排序共' + names.length + '个:');
            for (var i = 0; i < names.length; i++) {
                console.log('  [' + i + '] ' + names[i]);
            }
        }

        var updated = 0;
        for (var i = 0; i < paths.length; i++) {
            var name = paths[i].getAttribute('name').toUpperCase();
            var di = labelIdx[name];
            if (di !== undefined && di < statusArray.length) {
                var newSts = statusArray[di];
                var cls = 'line path-clickable sts-' + newSts;
                if (paths[i].getAttribute('class') !== cls) {
                    paths[i].setAttribute('class', cls);
                    updated++;
                }
            }
        }
        if (updated > 0) {
            console.log(prefix + ' 状态已更新: ' + updated + ' 条线段');
        }
    }

    function updateBadgeCounts() {
        if (!activeSvgs.length) return;

        // 按 badgePrefix 分别记录问题设备, 供各自点击查看
        if (!window.__scadaStatusByPage) window.__scadaStatusByPage = {};

        activeSvgs.forEach(function (entry) {
            var paths = entry.svg.querySelectorAll('path[name]');
            var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            var devices = { 1: [], 2: [], 3: [], 4: [] };
            for (var i = 0; i < paths.length; i++) {
                var cls = paths[i].getAttribute('class') || '';
                var m = cls.match(/sts-(\d+)/);
                if (m) {
                    var sts = parseInt(m[1], 10);
                    if (counts.hasOwnProperty(sts)) {
                        counts[sts]++;
                        if (sts <= 4) devices[sts].push(paths[i].getAttribute('name'));
                    }
                }
            }
            // 各自更新对应的 badge
            var prefix = entry.badgePrefix || '';
            for (var s = 1; s <= 6; s++) {
                var el = document.getElementById(prefix + 'badgeSts' + s);
                if (el) {
                    var lbl = el.textContent.replace(/\d+$/, '') + counts[s];
                    el.textContent = lbl;
                    if (s <= 4 && !el._hasClick) {
                        el._hasClick = true;
                        el.style.cursor = 'pointer';
                        el.addEventListener('click', function (e) {
                            var stsNum = parseInt(e.currentTarget.id.replace(/\D/g, ''), 10);
                            showStatusList(stsNum, e.currentTarget);
                            e.stopPropagation();
                        });
                    }
                }
            }
            // 按前缀存储设备列表
            window.__scadaStatusByPage[prefix] = devices;
        });
    }

    // ============================================================
    // 状态设备列表弹窗
    // ============================================================
    var statusListEl = null;

    function ensureStatusList() {
        if (statusListEl) return;
        statusListEl = document.createElement('div');
        statusListEl.id = 'scadaStatusList';
        statusListEl.style.cssText =
            'position:fixed;z-index:99997;display:none;' +
            'background:#0d1520;border:1px solid #1e3a5f;border-radius:6px;' +
            'padding:0;box-shadow:0 8px 32px rgba(0,0,0,0.6);' +
            'font-family:"Microsoft YaHei",sans-serif;font-size:12px;' +
            'max-height:360px;overflow-y:auto;min-width:180px;';
        document.body.appendChild(statusListEl);
    }

    function showStatusList(sts, targetEl) {
        ensureStatusList();
        // 从 badge ID 提取前缀 (badgeSts1 → '', hkbadgeSts1 → 'hk')
        var badgeId = targetEl.id;
        var prefix = badgeId.replace(/badgeSts\d+$/, '');
        var pageData = window.__scadaStatusByPage ? (window.__scadaStatusByPage[prefix] || {}) : {};
        var devices = (pageData[sts] || []).slice();
        if (!devices.length) { statusListEl.style.display = 'none'; return; }

        // 按前缀分组
        var groups = {};
        devices.forEach(function (d) {
            var m = d.match(/^([A-Z]+)/);
            var key = m ? m[0] : '其他';
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        });

        var color = STATUS_COLORS[sts] || '#9ca3af';
        var title = STATUS_NAMES[sts] || '';

        var html = '<div style="padding:8px 12px;border-bottom:1px solid #1e3a5f;' +
            'color:' + color + ';font-weight:700;font-size:13px">' +
            title + ' (' + devices.length + ')</div>';

        var groupList = [];
        for (var g in groups) {
            if (groups.hasOwnProperty(g)) groupList.push({ key: g, items: groups[g] });
        }
        groupList.sort(function (a, b) { return a.key < b.key ? -1 : 1; });

        groupList.forEach(function (group) {
            html += '<div style="padding:4px 12px;color:#4a6a8a;font-size:10px;letter-spacing:1px">' +
                group.key + ' (' + group.items.length + ')</div>';
            group.items.forEach(function (name) {
                html += '<div style="padding:2px 16px;color:#c0c8d0;border-bottom:1px solid #1e3a5f22">' +
                    name + '</div>';
            });
        });

        statusListEl.innerHTML = html;
        statusListEl.style.display = 'block';

        // 定位在 badge 下方
        var rect = targetEl.getBoundingClientRect();
        var left = rect.left;
        var top = rect.bottom + 4;
        if (left + 220 > window.innerWidth) left = rect.right - 220;
        if (top + 360 > window.innerHeight) top = rect.top - 4 - Math.min(statusListEl.scrollHeight, 360);
        statusListEl.style.left = left + 'px';
        statusListEl.style.top = top + 'px';

        // 点击其他地方关闭
        setTimeout(function () {
            document.addEventListener('click', closeStatusList);
        }, 10);
    }

    function closeStatusList(e) {
        if (statusListEl && statusListEl.style.display === 'block') {
            var t = e.target;
            if (!t || (t.id.indexOf('badgeSts') === -1 && !statusListEl.contains(t))) {
                statusListEl.style.display = 'none';
                document.removeEventListener('click', closeStatusList);
            }
        }
    }

    // ============================================================
    // 线体弹窗
    // ============================================================
    var STATUS_NAMES = {
        1: '断电',
        2: '故障',
        3: '堵货',
        4: '超时故障',
        5: '运行',
        6: '停止'
    };

    var STATUS_COLORS = ['','#374151','#eab308','#3b82f6','#a855f7','#22c55e','#9ca3af'];
    var STATUS_BG    = ['','#1f1f1f','#2a2400','#001a33','#1a0030','#002a10','#1a1a1a'];

    var scadaPopup = null;

    function ensurePopup() {
        if (scadaPopup) return;
        scadaPopup = document.createElement('div');
        scadaPopup.id = 'scadaPopup';
        scadaPopup.style.cssText =
            'position:fixed;z-index:99999;display:none;' +
            'pointer-events:none;' +
            'font-family:"Microsoft YaHei","PingFang SC",sans-serif;' +
            'white-space:nowrap;';
        document.body.appendChild(scadaPopup);
    }

    function buildPopupHTML(name, statusText, sts) {
        var color = STATUS_COLORS[sts] || '#9ca3af';
        var bg    = STATUS_BG[sts]    || '#1a1a1a';
        var prefix = name.match(/^[A-Z]+/);
        var prefixStr = prefix ? prefix[0] : '';
        var numStr = name.replace(/^[A-Z]+/, '');

        var html = '<div style="' +
            'background:#0d1520;' +
            'border:1px solid ' + color + ';' +
            'border-radius:8px;' +
            'padding:0;' +
            'box-shadow:0 0 20px ' + color + '33, 0 8px 32px rgba(0,0,0,0.6);' +
            'overflow:hidden;' +
            'min-width:140px;' +
            '">';
        // 头部色条
        html += '<div style="background:' + color + ';height:3px;width:100%;"></div>';
        // 主体
        html += '<div style="padding:10px 14px;">';
        // 名称行
        html += '<div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">';
        html += '<span style="font-size:11px;color:' + color + ';font-weight:600;letter-spacing:1px;">' + prefixStr + '</span>';
        html += '<span style="font-size:16px;font-weight:700;color:#e8edf2;">' + numStr + '</span>';
        html += '</div>';
        // 状态行
        html += '<div style="display:flex;align-items:center;gap:6px;">';
        html += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + ';box-shadow:0 0 6px ' + color + ';"></span>';
        html += '<span style="font-size:12px;color:' + color + ';font-weight:500;">' + statusText + '</span>';
        html += '</div>';
        html += '</div></div>';
        return html;
    }

    function getLineStatus(el) {
        var cls = el.getAttribute('class') || '';
        var m = cls.match(/sts-(\d+)/);
        return m ? parseInt(m[1], 10) : null;
    }

    function getLineName(el) {
        if (el.tagName.toLowerCase() === 'path') {
            return el.getAttribute('name');
        }
        return el.getAttribute('data-for') || el.textContent.trim();
    }

    function getCorrespondingPath(el) {
        if (el.tagName.toLowerCase() === 'path') return el;
        var name = el.getAttribute('data-for');
        if (name) {
            for (var i = 0; i < activeSvgs.length; i++) {
                var p = activeSvgs[i].svg.querySelector('path[name="' + CSS.escape(name) + '"]');
                if (p) return p;
            }
        }
        return null;
    }

    function showPopup(name, statusCode, x, y) {
        ensurePopup();
        var sts = statusCode || 6;
        var statusText = STATUS_NAMES[sts] || '未知';
        scadaPopup.innerHTML = buildPopupHTML(name, statusText, sts);

        // 防止溢出视口
        var pw = 160, ph = 70;
        var left = x + 16;
        var top = y + 16;
        if (left + pw > window.innerWidth)  left = x - pw - 8;
        if (top  + ph > window.innerHeight) top  = y - ph - 8;

        scadaPopup.style.left = left + 'px';
        scadaPopup.style.top  = top  + 'px';
        scadaPopup.style.display = 'block';
    }

    function hidePopup() {
        if (scadaPopup) scadaPopup.style.display = 'none';
    }

    function initPopupEvents(svgEl) {
        ensurePopup();

        svgEl.addEventListener('click', function (e) {
            var target = e.target;
            var isPath = target.tagName && target.tagName.toLowerCase() === 'path'
                && target.hasAttribute('name')
                && target.classList.contains('path-clickable');
            var isText = target.tagName && target.tagName.toLowerCase() === 'text'
                && target.classList.contains('label-clickable');

            if (isPath || isText) {
                e.stopPropagation();
                var name = getLineName(target);
                var pathEl = getCorrespondingPath(target);
                var sts = pathEl ? getLineStatus(pathEl) : null;
                showPopup(name, sts, e.clientX, e.clientY);
            } else {
                hidePopup();
            }
        });

        // 点击页面任何空白区域隐藏弹窗
        document.addEventListener('click', function (e) {
            if (scadaPopup && scadaPopup.style.display === 'block') {
                var target = e.target;
                var isPath = target.classList.contains('path-clickable');
                var isText = target.classList.contains('label-clickable');
                if (!isPath && !isText) hidePopup();
            }
        });

        // 滚动时隐藏弹窗
        var svgArea = document.querySelector('.svg-area');
        if (svgArea) {
            svgArea.addEventListener('scroll', hidePopup);
        }
    }

    // ============================================================
    // 对外接口
    // ============================================================
    window.scada = window.scada || {};

    window.scada.initSvgFlow = function (svgId) {
        return initSvgFlow(svgId);
    };

    window.scada.initHkSvgFlow = function (svgId) {
        svg = document.getElementById(svgId);
        if (!svg) return false;

        // 清除旧元素
        ['line','gbt','ng','nggbt','motor','collisionmotor','blun','zhix','emg','scan','safetydoor','aconveyorline-label','collisionmotor-label']
            .forEach(function (cls) {
                svg.querySelectorAll('.' + cls).forEach(function (el) { el.remove(); });
            });

        drawHkLine(svg);
        initPopupEvents(svg);
        // 移除同 prefix 的旧条目, 防止切标签时重复累加
        activeSvgs = activeSvgs.filter(function (e) { return e.badgePrefix !== 'hk'; });
        activeSvgs.push({ svg: svg, badgePrefix: 'hk' });
        console.log('HK SCADA SVG 流程图已初始化');
        return true;
    };

    window.scada.initDdkSvgFlow = function (svgId) {
        svg = document.getElementById(svgId);
        if (!svg) return false;
        ['line','gbt','ng','nggbt','motor','collisionmotor','blun','zhix','emg','scan','safetydoor','aconveyorline-label','collisionmotor-label']
            .forEach(function (cls) {
                svg.querySelectorAll('.' + cls).forEach(function (el) { el.remove(); });
            });
        drawDdkLine(svg);
        initPopupEvents(svg);
        activeSvgs = activeSvgs.filter(function (e) { return e.badgePrefix !== 'ddk'; });
        activeSvgs.push({ svg: svg, badgePrefix: 'ddk' });
        console.log('DDK SCADA SVG 流程图已初始化');
        return true;
    };

    window.scada.initKkSvgFlow = function (svgId) {
        svg = document.getElementById(svgId);
        if (!svg) return false;
        ['line','gbt','ng','nggbt','motor','collisionmotor','blun','zhix','emg','scan','safetydoor','aconveyorline-label','collisionmotor-label']
            .forEach(function (cls) {
                svg.querySelectorAll('.' + cls).forEach(function (el) { el.remove(); });
            });
        drawKkLine(svg);
        initPopupEvents(svg);
        activeSvgs = activeSvgs.filter(function (e) { return e.badgePrefix !== 'kk'; });
        activeSvgs.push({ svg: svg, badgePrefix: 'kk' });
        console.log('KK SCADA SVG 流程图已初始化');
        return true;
    };

    function pollAllStatus() {
        DEVICE_TYPES.forEach(function (cfg) { fetchStatus(cfg); });
    }

    window.scada.startPolling = function () {
        stopPolling();

        // 立即获取一次
        pollAllStatus();

        // 每5秒轮询状态
        pollIntervals.push(setInterval(pollAllStatus, 5000));

        console.log('SCADA 轮询已启动');
    };

    window.scada.stopPolling = function () {
        stopPolling();
    };

    function stopPolling() {
        pollIntervals.forEach(function (id) { clearInterval(id); });
        pollIntervals = [];
    }
})();
