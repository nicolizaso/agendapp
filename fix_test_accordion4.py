import re

with open('/home/jules/verification/verify_active_workout_accordion.py', 'r') as f:
    content = f.read()

content = content.replace(
    'page.get_by_role("button").filter(has_text="Agregar Ejercicio").click(force=True)',
    'page.locator("button").filter(has_text="Agregar Ejercicio").click(force=True)'
)

with open('/home/jules/verification/verify_active_workout_accordion.py', 'w') as f:
    f.write(content)
