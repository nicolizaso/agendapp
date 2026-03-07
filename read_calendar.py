with open('src/features/dashboard/CalendarSection.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 50 <= i <= 90:
            print(f"{i}: {line.rstrip()}")
