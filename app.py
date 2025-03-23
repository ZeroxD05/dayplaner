# app.py
from flask import Flask, render_template, request, redirect, url_for, jsonify
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)

DATA_FILE = 'tasks.json'

def load_tasks():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_tasks(tasks):
    with open(DATA_FILE, 'w') as f:
        json.dump(tasks, f)

@app.route('/')
def index():
    today = datetime.now().strftime('%Y-%m-%d')
    tasks = load_tasks()
    
    # Generiere Kalendertage für den aktuellen Monat
    current_date = datetime.now()
    _, days_in_month = calendar_month_info(current_date.year, current_date.month)
    
    return render_template('index.html', tasks=tasks, today=today, days_in_month=days_in_month, 
                           current_month=current_date.strftime('%B'), current_year=current_date.year)

@app.route('/tasks')
def tasks():
    today = datetime.now().strftime('%Y-%m-%d')
    tasks = load_tasks()
    
    # Sortiere Tasks nach Datum und Zeit
    tasks.sort(key=lambda x: (x['date'], x['time']))
    
    return render_template('tasks.html', tasks=tasks, today=today)

def calendar_month_info(year, month):
    # Erster Tag des Monats
    first_day = datetime(year, month, 1)
    # Bestimme den Wochentag (0 = Montag, 6 = Sonntag)
    first_weekday = first_day.weekday()
    
    # Anzahl der Tage im Monat
    if month == 12:
        last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = datetime(year, month + 1, 1) - timedelta(days=1)
    
    days_in_month = last_day.day
    
    # Generiere Kalenderinformationen
    calendar_days = []
    
    # Füge leere Zellen für Tage vor dem ersten Tag des Monats hinzu
    for _ in range(first_weekday):
        calendar_days.append({"day": None, "date": None})
    
    # Füge alle Tage des Monats hinzu
    for day in range(1, days_in_month + 1):
        date_str = f"{year}-{month:02d}-{day:02d}"
        calendar_days.append({"day": day, "date": date_str})
    
    return first_weekday, calendar_days

@app.route('/add_task', methods=['POST'])
def add_task():
    tasks = load_tasks()
    new_task = {
        'id': len(tasks) + 1,
        'title': request.form.get('title'),
        'description': request.form.get('description'),
        'date': request.form.get('date'),
        'time': request.form.get('time'),
        'priority': request.form.get('priority'),
        'completed': False
    }
    tasks.append(new_task)
    save_tasks(tasks)
    return redirect(url_for('index'))

@app.route('/complete_task/<int:task_id>', methods=['POST'])
def complete_task(task_id):
    tasks = load_tasks()
    for task in tasks:
        if task['id'] == task_id:
            task['completed'] = not task['completed']
            break
    save_tasks(tasks)
    
    # Überprüfe, von welcher Seite der Request kam
    referer = request.headers.get('Referer', '')
    if '/tasks' in referer:
        return redirect(url_for('tasks'))
    return redirect(url_for('index'))

@app.route('/delete_task/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    tasks = load_tasks()
    tasks = [task for task in tasks if task['id'] != task_id]
    save_tasks(tasks)
    
    # Überprüfe, von welcher Seite der Request kam
    referer = request.headers.get('Referer', '')
    if '/tasks' in referer:
        return redirect(url_for('tasks'))
    return redirect(url_for('index'))

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    date = request.args.get('date')
    filter_type = request.args.get('filter', 'all')
    priority = request.args.get('priority', 'all')
    show_completed = request.args.get('completed', 'false')
    
    tasks = load_tasks()
    
    # Filtern nach Datum
    if date:
        tasks = [task for task in tasks if task['date'] == date]
    
    # Filtern nach Zeitraum
    today = datetime.now().strftime('%Y-%m-%d')
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    if filter_type == 'today':
        tasks = [task for task in tasks if task['date'] == today]
    elif filter_type == 'tomorrow':
        tasks = [task for task in tasks if task['date'] == tomorrow]
    elif filter_type == 'week':
        week_end = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        tasks = [task for task in tasks if today <= task['date'] <= week_end]
    
    # Filtern nach Priorität
    if priority != 'all':
        tasks = [task for task in tasks if task['priority'] == priority]
    
    # Filtern nach Erledigt-Status
    if show_completed.lower() == 'false':
        tasks = [task for task in tasks if not task['completed']]
    
    # Sortieren nach Datum und Zeit
    tasks.sort(key=lambda x: (x['date'], x['time']))
    
    return jsonify(tasks)

@app.route('/update_task/<int:task_id>', methods=['POST'])
def update_task(task_id):
    tasks = load_tasks()
    data = request.json
    
    for task in tasks:
        if task['id'] == task_id:
            if 'title' in data:
                task['title'] = data['title']
            if 'description' in data:
                task['description'] = data['description']
            if 'time' in data:
                task['time'] = data['time']
            if 'priority' in data:
                task['priority'] = data['priority']
            break
            
    save_tasks(tasks)
    return jsonify({"success": True})

@app.route('/calendar/<int:year>/<int:month>')
def get_calendar(year, month):
    first_weekday, calendar_days = calendar_month_info(year, month)
    month_name = datetime(year, month, 1).strftime('%B')
    
    tasks = load_tasks()
    task_counts = {}
    
    for day in calendar_days:
        if day["date"]:
            tasks_on_day = [task for task in tasks if task['date'] == day["date"]]
            task_counts[day["date"]] = len(tasks_on_day)
    
    return jsonify({
        "calendar_days": calendar_days,
        "month_name": month_name,
        "year": year,
        "task_counts": task_counts
    })

if __name__ == '__main__':
    app.run(debug=True)