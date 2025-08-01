import React, { FC } from 'react';
import type { User } from '../types';

const UserProfileModal: FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
      <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
      <div className="modal-header"><h2>User Profile</h2></div>
      <div className="modal-body">
        <p><strong>Name:</strong> {user.name}</p>
        <p><em>More settings coming soon...</em></p>
      </div>
    </div>
  </div>
);

export default UserProfileModal;
