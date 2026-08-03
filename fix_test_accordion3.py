import re

with open('/home/jules/verification/verify_active_workout_accordion.py', 'r') as f:
    content = f.read()

content = content.replace(
    'page.get_by_text("Press de Banca").first.click(force=True)',
    'page.locator("button").last.click(force=True)'
)
content = content.replace(
    'page.get_by_placeholder("Buscar ejercicio...").fill("Press")',
    '# no filtering, just grab a button'
)
content = content.replace(
    'page.get_by_text("Sentadilla Libre").first.click(force=True)',
    'page.locator("button").last.click(force=True)'
)
content = content.replace(
    'page.get_by_placeholder("Buscar ejercicio...").fill("Sentadilla")',
    '# no filtering, just grab a button'
)

# And clicking the second card to expand it:
content = content.replace(
    'page.get_by_text("Sentadilla Libre").click(force=True)',
    'page.locator(".bg-neutral-900").last.click(force=True)'
)

with open('/home/jules/verification/verify_active_workout_accordion.py', 'w') as f:
    f.write(content)
