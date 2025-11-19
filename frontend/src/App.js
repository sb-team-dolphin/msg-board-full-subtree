import React, { useState, useEffect } from 'react';
import './App.css';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import { getUsers, createUser, updateUser, deleteUser } from './services/api';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // 사용자 목록 로드
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users. Please check if the backend is running.');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      setError(null);
      const newUser = await createUser(userData);
      setUsers([...users, newUser]);
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleUpdateUser = async (id, userData) => {
    try {
      setError(null);
      const updated = await updateUser(id, userData);
      setUsers(users.map(u => u.id === id ? updated : u));
      setEditingUser(null);
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MyApp - DevOps Pipeline Demo</h1>
        <p>Spring Boot + React + AWS ECS (Fargate) + Blue/Green Deployment</p>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="form-section">
          <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
          <UserForm
            user={editingUser}
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            onCancel={editingUser ? handleCancelEdit : null}
          />
        </section>

        <section className="list-section">
          <h2>User List</h2>
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <UserList
              users={users}
              onEdit={handleEdit}
              onDelete={handleDeleteUser}
            />
          )}
        </section>
      </main>

      <footer className="App-footer">
        <p>Terraform + GitHub Actions + AWS ECS + CodeDeploy</p>
      </footer>
    </div>
  );
}

export default App;
