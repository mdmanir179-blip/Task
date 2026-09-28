import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  X,
  ShieldAlert,
  UserCheck,
  Copy,
  Check,
} from 'lucide-react';
import { CompanyPerson, User as UserModel } from '../types';

interface CompanyDirectoryProps {
  persons: CompanyPerson[];
  currentUser: UserModel;
  onAddPerson: (person: Omit<CompanyPerson, 'id' | 'updatedAt' | 'updatedBy'>) => void;
  onEditPerson: (id: string, person: Partial<CompanyPerson>) => void;
  onDeletePerson: (id: string) => void;
}

export const CompanyDirectory: React.FC<CompanyDirectoryProps> = ({
  persons,
  currentUser,
  onAddPerson,
  onEditPerson,
  onDeletePerson,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<CompanyPerson | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const isMaster = currentUser.role === 'master_admin';

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setName('');
    setCompanyName('');
    setDesignation('');
    setAddress('');
    setPhone('');
    setEmail('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: CompanyPerson) => {
    setEditingPerson(p);
    setName(p.name);
    setCompanyName(p.companyName);
    setDesignation(p.designation);
    setAddress(p.address);
    setPhone(p.phone);
    setEmail(p.email);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPerson) {
      onEditPerson(editingPerson.id, {
        name: name.trim(),
        companyName: companyName.trim(),
        designation: designation.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });
    } else {
      onAddPerson({
        name: name.trim(),
        companyName: companyName.trim(),
        designation: designation.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPersons = persons.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q) ||
      p.designation.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Company Personnel Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              {persons.length} {persons.length === 1 ? 'Contact' : 'Contacts'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Directory of company leadership, department heads, and key external corporate contacts
          </p>
        </div>

        {/* Action Button & Permission Notice */}
        <div className="flex items-center gap-2">
          {isMaster ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Key Person</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Only Access</span>
            </div>
          )}
        </div>
      </div>

      {/* Permission Reminder Banner */}
      {!isMaster && (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Access Policy:</strong> Only the <strong>Master Admin</strong> can add, edit, or delete corporate contacts. Admins and employees have view and direct contact access.
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, designation, phone, or address..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Grid of Key Personnel Cards */}
      {filteredPersons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No Personnel Found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isMaster ? 'Click "Add Key Person" to add directors, managers, or company officers.' : 'Directory is currently empty.'}
          </p>
          {isMaster && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Key Person</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPersons.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {p.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {p.designation}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.companyName}
                      </p>
                    </div>
                  </div>

                  {/* Master Admin Controls Only */}
                  {isMaster && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                        title="Edit Person"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                            onDeletePerson(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Person"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Details List */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Phone */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-semibold">{p.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${p.phone}`}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                      >
                        Call
                      </a>
                      <button
                        onClick={() => handleCopy(p.phone, `ph_${p.id}`)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Copy Phone"
                      >
                        {copiedId === `ph_${p.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                      <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`mailto:${p.email}`}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px]"
                      >
                        Email
                      </a>
                      <button
                        onClick={() => handleCopy(p.email, `em_${p.id}`)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Copy Email"
                      >
                        {copiedId === `em_${p.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{p.address}</span>
                  </div>

                  {/* Notes if any */}
                  {p.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-2 pt-1">
                      Notes: {p.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Updated footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Last Updated: {new Date(p.updatedAt).toLocaleDateString()}</span>
                <span>By: {p.updatedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal (Master Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingPerson ? 'Edit Personnel Details' : 'Add Key Personnel'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Michael Vance"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. TBC Group Ltd."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Managing Director"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XXXXXXXX"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@tbcgroup.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Office / Residential Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Building, Area, City..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Key Responsibilities
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Primary signer for banking and material procurement"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingPerson ? 'Save Changes' : 'Add Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
