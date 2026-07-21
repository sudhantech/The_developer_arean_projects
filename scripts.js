class TaskManager{
  constructor(){
    this.tasks = this.loadFromStorage();
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.editingId = null;
    this.dragId = null;
    this.els = {
      form: document.getElementById('taskForm'),
      input: document.getElementById('taskInput'),
      priority: document.getElementById('prioritySelect'),
      due: document.getElementById('dueInput'),
      error: document.getElementById('errorMsg'),
      list: document.getElementById('taskList'),
      empty: document.getElementById('emptyState'),
      search: document.getElementById('searchInput'),
      filters: document.querySelectorAll('.filter-btn'),
      statTotal: document.getElementById('statTotal'),
      statActive: document.getElementById('statActive'),
      statDone: document.getElementById('statDone'),
      statRate: document.getElementById('statRate'),
      clearCompleted: document.getElementById('clearCompletedBtn'),
      exportBtn: document.getElementById('exportBtn'),
      importBtn: document.getElementById('importBtn'),
      importInput: document.getElementById('importInput'),
      themeToggle: document.getElementById('themeToggle'),
      themeLabel: document.getElementById('themeLabel'),
      toast: document.getElementById('toast')
    };
    this.init();
  }

  init(){
    this.applyTheme(localStorage.getItem('ledger_theme') || 'dark');
    this.bindEvents();
    this.render();
  }

  /* ---------- storage ---------- */
  loadFromStorage(){
    try{
      const raw = localStorage.getItem('ledger_tasks');
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error('Could not read saved tasks, starting fresh.', e);
      return [];
    }
  }

  saveToStorage(){
    try{
      localStorage.setItem('ledger_tasks', JSON.stringify(this.tasks));
    }catch(e){
      this.showToast('Could not save — storage may be full.');
    }
  }

  /* ---------- CRUD ---------- */
  addTask(text, priority, due){
    const trimmed = text.trim();
    if(!trimmed){
      this.showError("Entry can't be empty.");
      return false;
    }
    if(trimmed.length > 140){
      this.showError('Keep entries under 140 characters.');
      return false;
    }
    const task = {
      id: Date.now() + Math.random().toString(16).slice(2),
      text: trimmed,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      priority: priority || 'medium',
      due: due || ''
    };
    this.tasks.unshift(task);
    this.saveToStorage();
    this.render();
    this.hideError();
    return true;
  }

  deleteTask(id){
    const node = this.els.list.querySelector(`[data-id="${id}"]`);
    const commit = () => {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveToStorage();
      this.render();
    };
    if(node){
      node.classList.add('removing');
      node.addEventListener('animationend', commit, {once:true});
    }else{
      commit();
    }
  }

  toggleComplete(id){
    this.tasks = this.tasks.map(t =>
      t.id === id
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
        : t
    );
    this.saveToStorage();
    this.render();
  }

  updateTaskText(id, newText){
    const trimmed = newText.trim();
    if(!trimmed) return;
    this.tasks = this.tasks.map(t => t.id === id ? {...t, text: trimmed} : t);
    this.saveToStorage();
    this.editingId = null;
    this.render();
  }

  reorderTask(draggedId, targetId){
    const fromIdx = this.tasks.findIndex(t => t.id === draggedId);
    const toIdx = this.tasks.findIndex(t => t.id === targetId);
    if(fromIdx === -1 || toIdx === -1) return;
    const [moved] = this.tasks.splice(fromIdx, 1);
    this.tasks.splice(toIdx, 0, moved);
    this.saveToStorage();
    this.render();
  }

  clearCompleted(){
    const n = this.tasks.filter(t => t.completed).length;
    if(n === 0){ this.showToast('No completed entries to clear.'); return; }
    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveToStorage();
    this.render();
    this.showToast(`Cleared ${n} completed ${n === 1 ? 'entry' : 'entries'}.`);
  }

  /* ---------- filtering ---------- */
  getVisibleTasks(){
    let list = this.tasks;
    if(this.currentFilter === 'active') list = list.filter(t => !t.completed);
    if(this.currentFilter === 'completed') list = list.filter(t => t.completed);
    if(this.searchTerm){
      const q = this.searchTerm.toLowerCase();
      list = list.filter(t => t.text.toLowerCase().includes(q));
    }
    return list;
  }

  /* ---------- render ---------- */
  render(){
    const visible = this.getVisibleTasks();
    this.els.list.innerHTML = '';

    if(visible.length === 0){
      this.els.empty.style.display = 'block';
      this.els.empty.querySelector('.big').textContent =
        this.tasks.length === 0 ? 'Nothing logged' : 'No matches';
    }else{
      this.els.empty.style.display = 'none';
      visible.forEach(task => this.els.list.appendChild(this.buildTaskNode(task)));
    }
    this.updateStats();
  }

  buildTaskNode(task){
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;
    li.dataset.priority = task.priority;
    li.draggable = true;

    const check = document.createElement('button');
    check.className = 'check';
    check.type = 'button';
    check.setAttribute('aria-label', 'Toggle complete');
    check.textContent = task.completed ? '✓' : '';
    check.addEventListener('click', () => this.toggleComplete(task.id));

    const body = document.createElement('div');
    body.className = 'task-body';

    if(this.editingId === task.id){
      const editInput = document.createElement('input');
      editInput.className = 'task-edit-input';
      editInput.value = task.text;
      editInput.maxLength = 140;
      setTimeout(() => { editInput.focus(); editInput.select(); }, 0);
      editInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') this.updateTaskText(task.id, editInput.value);
        if(e.key === 'Escape'){ this.editingId = null; this.render(); }
      });
      editInput.addEventListener('blur', () => this.updateTaskText(task.id, editInput.value));
      body.appendChild(editInput);
    }else{
      const textEl = document.createElement('div');
      textEl.className = 'task-text';
      textEl.textContent = task.text;
      body.appendChild(textEl);

      const meta = document.createElement('div');
      meta.className = 'task-meta';

      const prioTag = document.createElement('span');
      prioTag.textContent = task.priority.toUpperCase();
      meta.appendChild(prioTag);

      if(task.due){
        const dueSpan = document.createElement('span');
        dueSpan.className = 'due';
        const isOverdue = !task.completed && new Date(task.due) < new Date(new Date().toDateString());
        if(isOverdue) dueSpan.classList.add('overdue');
        dueSpan.textContent = (isOverdue ? 'overdue · ' : 'due ') + task.due;
        meta.appendChild(dueSpan);
      }

      if(task.completed && task.completedAt){
        const stamp = document.createElement('span');
        stamp.className = 'stamp';
        const d = new Date(task.completedAt);
        stamp.textContent = 'closed ' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        meta.appendChild(stamp);
      }
      body.appendChild(meta);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit';
    editBtn.type = 'button';
    editBtn.title = 'Edit';
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => { this.editingId = task.id; this.render(); });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete';
    delBtn.type = 'button';
    delBtn.title = 'Delete';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => this.deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(actions);

    // drag and drop
    li.addEventListener('dragstart', () => {
      this.dragId = task.id;
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      if(this.dragId && this.dragId !== task.id) this.reorderTask(this.dragId, task.id);
    });

    return li;
  }

  updateStats(){
    const total = this.tasks.length;
    const done = this.tasks.filter(t => t.completed).length;
    const active = total - done;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    this.els.statTotal.textContent = total;
    this.els.statActive.textContent = active;
    this.els.statDone.textContent = done;
    this.els.statRate.textContent = rate + '%';
  }

  /* ---------- misc UI ---------- */
  showError(msg){
    this.els.error.textContent = msg;
    this.els.error.classList.add('show');
  }
  hideError(){ this.els.error.classList.remove('show'); }

  showToast(msg){
    const t = this.els.toast;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  applyTheme(theme){
    document.body.dataset.theme = theme;
    this.els.themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    localStorage.setItem('ledger_theme', theme);
  }

  exportData(){
    const blob = new Blob([JSON.stringify(this.tasks, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup exported.');
  }

  importData(file){
    const reader = new FileReader();
    reader.onload = (e) => {
      try{
        const parsed = JSON.parse(e.target.result);
        if(!Array.isArray(parsed)) throw new Error('not an array');
        this.tasks = parsed;
        this.saveToStorage();
        this.render();
        this.showToast('Backup imported.');
      }catch(err){
        this.showToast('Import failed — invalid file.');
      }
    };
    reader.readAsText(file);
  }

  /* ---------- events ---------- */
  bindEvents(){
    this.els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = this.addTask(this.els.input.value, this.els.priority.value, this.els.due.value);
      if(ok){
        this.els.input.value = '';
        this.els.due.value = '';
        this.els.input.focus();
      }
    });
    this.els.input.addEventListener('input', () => this.hideError());

    this.els.filters.forEach(btn => {
      btn.addEventListener('click', () => {
        this.els.filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });

    this.els.search.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.render();
    });

    this.els.clearCompleted.addEventListener('click', () => this.clearCompleted());
    this.els.exportBtn.addEventListener('click', () => this.exportData());
    this.els.importBtn.addEventListener('click', () => this.els.importInput.click());
    this.els.importInput.addEventListener('change', (e) => {
      if(e.target.files[0]) this.importData(e.target.files[0]);
      e.target.value = '';
    });

    this.els.themeToggle.addEventListener('click', () => {
      const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
    });

    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement.tagName;
      const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if(e.key === 'Escape'){
        if(this.editingId !== null){ this.editingId = null; this.render(); }
        else { document.activeElement.blur(); }
        return;
      }
      if(typing) return;
      if(e.key.toLowerCase() === 'n'){ e.preventDefault(); this.els.input.focus(); }
      if(e.key === '/'){ e.preventDefault(); this.els.search.focus(); }
    });
  }
}

const ledger = new TaskManager();
