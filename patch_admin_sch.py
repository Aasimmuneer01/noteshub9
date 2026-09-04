import re

with open('admin.html', 'r') as f:
    content = f.read()

target = """                if (enabled && settings.startTime) {
                    document.getElementById('sch-preview').classList.remove('hidden');
                    const start = settings.startTime.toDate();
                    const restore = settings.restoreTime ? settings.restoreTime.toDate() : null;
                    document.getElementById('sch-preview-text').innerHTML = `
                        <strong>Mode:</strong> ${settings.mode || 'Maintenance'}<br>
                        <strong>Starts:</strong> ${start.toLocaleString()}<br>
                        <strong>Restores:</strong> ${restore ? restore.toLocaleString() : 'Not Set'}<br>
                        <strong>Status:</strong> Scheduled
                    `;
                    document.getElementById('sch-preview-countdown').textContent = "Scheduler Active";
                } else {
                    document.getElementById('sch-preview').classList.add('hidden');
                }"""

replacement = """                if (window.schTimer) clearInterval(window.schTimer);
                if (enabled && settings.startTime) {
                    document.getElementById('sch-preview').classList.remove('hidden');
                    const start = settings.startTime.toDate();
                    const restore = settings.restoreTime ? settings.restoreTime.toDate() : null;
                    
                    function updateSchStatus() {
                        const nowMs = Date.now();
                        const startMs = start.getTime();
                        const restoreMs = restore ? restore.getTime() : 0;
                        let schedStatus = 'Upcoming';
                        let isInvalid = restoreMs && restoreMs <= startMs;
                        
                        if (isInvalid) {
                            schedStatus = '<span class="text-red-500">Invalid (Restore before Start)</span>';
                        } else if (startMs && nowMs < startMs) {
                            schedStatus = '<span class="text-yellow-500">Upcoming</span>';
                        } else if (startMs && restoreMs && nowMs >= startMs && nowMs < restoreMs) {
                            schedStatus = '<span class="text-red-500">Active</span>';
                        } else if (restoreMs && nowMs >= restoreMs) {
                            schedStatus = '<span class="text-gray-500">Expired</span>';
                        } else if (startMs && nowMs >= startMs && !restoreMs) {
                            schedStatus = '<span class="text-red-500">Active (Indefinite)</span>';
                        }

                        document.getElementById('sch-preview-text').innerHTML = `
                            <strong>Mode:</strong> ${settings.mode || 'Maintenance'}<br>
                            <strong>Starts:</strong> ${start.toLocaleString()}<br>
                            <strong>Restores:</strong> ${restore ? restore.toLocaleString() : 'Not Set'}<br>
                            <strong>Status:</strong> ${schedStatus}
                        `;

                        if (nowMs < startMs && !isInvalid) {
                            const diff = startMs - nowMs;
                            const h = Math.floor(diff / 3600000);
                            const m = Math.floor((diff % 3600000) / 60000);
                            const s = Math.floor((diff % 60000) / 1000);
                            document.getElementById('sch-preview-countdown').textContent = `Starts in: ${h}h ${m}m ${s}s`;
                        } else if (restoreMs && nowMs >= startMs && nowMs < restoreMs) {
                            const diff = restoreMs - nowMs;
                            const h = Math.floor(diff / 3600000);
                            const m = Math.floor((diff % 3600000) / 60000);
                            const s = Math.floor((diff % 60000) / 1000);
                            document.getElementById('sch-preview-countdown').textContent = `Time until restore: ${h}h ${m}m ${s}s`;
                        } else {
                            document.getElementById('sch-preview-countdown').textContent = "";
                        }
                    }
                    
                    updateSchStatus();
                    window.schTimer = setInterval(updateSchStatus, 1000);

                } else {
                    document.getElementById('sch-preview').classList.add('hidden');
                }"""

if target in content:
    content = content.replace(target, replacement)
    with open('admin.html', 'w') as f:
        f.write(content)
    print("Replaced successfully.")
else:
    print("Target not found.")

