import re

with open('/home/jules/verification/verify_active_workout_accordion.py', 'r') as f:
    content = f.read()

content = content.replace(
    'page.get_by_role("button").filter(has_text="Press de Banca").click(force=True)',
    'page.locator("button").filter(has_text="Press de Banca").first.click(force=True)'
)
content = content.replace(
    'page.get_by_role("button").filter(has_text="Sentadilla Libre").click(force=True)',
    'page.locator("button").filter(has_text="Sentadilla Libre").first.click(force=True)'
)

with open('/home/jules/verification/verify_active_workout_accordion.py', 'w') as f:
    f.write(content)
