import re

with open('admin.html', 'r') as f:
    content = f.read()

target_css = """        body {
            font-family: 'Inter', sans-serif;"""

replacement_css = """        html.light-theme {
            --background: #f8fafc;
            --surface: #ffffff;
            --secondary: #f1f5f9;
        }
        html.light-theme body,
        html.light-theme .text-white {
            color: #0f172a !important;
        }
        html.light-theme .bg-background {
            background-color: var(--background) !important;
        }
        html.light-theme .bg-surface {
            background-color: var(--surface) !important;
            border-color: #e2e8f0 !important;
        }
        html.light-theme .bg-black {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
        }
        html.light-theme .text-gray-300,
        html.light-theme .text-gray-400 {
            color: #475569 !important;
        }
        html.light-theme .border-white\\/5,
        html.light-theme .border-white\\/10 {
            border-color: #e2e8f0 !important;
        }

        body {
            font-family: 'Inter', sans-serif;"""

target_js = """</head>"""
replacement_js = """    <script>
        try {
            if (localStorage.getItem('noteshub9_light_theme') === 'true') {
                document.documentElement.classList.add('light-theme');
            }
        } catch (e) {}
    </script>
</head>"""

content = content.replace(target_css, replacement_css)
content = content.replace(target_js, replacement_js)

with open('admin.html', 'w') as f:
    f.write(content)

