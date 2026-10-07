import React, { useEffect, useState } from 'react';
import { userApi } from '../../services/api/userApi';
import { User } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/helpers';
import { Trash2, AlertTriangle, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store/store';

export const UsersPage: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Deletion modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.listUsers(0, 100);
      setUsers(res.users);
    } catch (err) {
      console.error('Failed to load user accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (user: User) => {
    setApiError(null);
    setUserToDelete(user);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleteLoading(true);
      setApiError(null);
      await userApi.deleteUser(userToDelete.id);
      
      // Update UI state
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setDeleteOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setApiError(err.response?.data?.detail || 'Inability to close account. Standard admin restriction might apply.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono text-dark-500">#USR-{row.id}</span>,
      sortable: true,
    },
    {
      header: 'Full Name',
      accessorKey: 'name',
      cell: (row) => <span className="font-semibold">{row.name}</span>,
      sortable: true,
    },
    {
      header: 'Email Address',
      accessorKey: 'email',
      sortable: true,
    },
    {
      header: 'Access Role',
      accessorKey: 'role',
      cell: (row) => (
        <Badge variant={row.role === 'admin' ? 'accent' : 'primary'} className="uppercase text-[10px] tracking-wider font-bold">
          {row.role}
        </Badge>
      ),
      sortable: true,
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: (row) => <span>{formatDate(row.created_at, true)}</span>,
      sortable: true,
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row) => {
        const isSelf = row.id === currentUser?.id;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteClick(row)}
            disabled={isSelf}
            title={isSelf ? 'Cannot delete your own account' : 'Close user account'}
            className="h-8.5 w-8.5 p-0 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
          >
            <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            User Operations Registry
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Manage user permissions, review registry details, and verify credentials status.
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} className="flex items-center gap-2 self-start sm:self-auto select-none">
          <RefreshCw className="w-4 h-4" />
          <span>Sync Registry</span>
        </Button>
      </div>

      {/* Users DataTable Card */}
      <Card>
        <CardHeader>
          <CardTitle>Platform User Accounts</CardTitle>
          <CardDescription>List of profiles verified and authenticated to compute carbon offsets.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchKey="name"
            searchPlaceholder="Search users by name..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Deletion Safety Modal */}
      <Dialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm User Account Closure"
        description="This administrative action is permanent and cannot be undone."
      >
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-semibold text-danger">
            {apiError}
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/35 rounded-2xl text-xs flex gap-3 items-start select-none">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="space-y-1.5 leading-normal text-dark-800 dark:text-dark-250">
              <p className="font-bold">Are you absolutely sure you want to delete this profile?</p>
              <p>
                Deleting <strong>{userToDelete?.name}</strong> (<code>{userToDelete?.email}</code>) will immediately revoke their workspace access, close their active session, and remove all associate carbon prediction data.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-dark-100 dark:border-dark-850 select-none">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="flex items-center gap-1.5"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Closing account...</span>
                </>
              ) : (
                <span>Close Profile Account</span>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
export default UsersPage;
