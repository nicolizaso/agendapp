import re

with open('/home/jules/verification/verify_active_workout_accordion.py', 'r') as f:
    content = f.read()

content = content.replace(
    'page.locator("button").filter(has_text="Press de Banca").first.click(force=True)',
    'page.get_by_placeholder("Buscar ejercicio...").fill("Press")\n            time.sleep(0.5)\n            page.get_by_text("Press de Banca").first.click(force=True)'
)
content = content.replace(
    'page.locator("button").filter(has_text="Sentadilla Libre").first.click(force=True)',
    'page.get_by_placeholder("Buscar ejercicio...").fill("Sentadilla")\n            time.sleep(0.5)\n            page.get_by_text("Sentadilla Libre").first.click(force=True)'
)

with open('/home/jules/verification/verify_active_workout_accordion.py', 'w') as f:
    f.write(content)
