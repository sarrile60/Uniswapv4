import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const AdminAuditLogs = () => {
  const { api } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 50 };
      if (actionFilter !== 'all') params.action = actionFilter;

      const response = await api.get('/admin/audit-logs', { params });
      if (response.data.ok) {
        setLogs(response.data.data.logs);
        setTotalPages(response.data.data.pages);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('created')) return 'bg-green-100 text-green-700';
    if (action.includes('deleted')) return 'bg-red-100 text-red-700';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-700';
    if (action.includes('approved')) return 'bg-green-100 text-green-700';
    if (action.includes('rejected')) return 'bg-red-100 text-red-700';
    if (action.includes('sent')) return 'bg-purple-100 text-purple-700';
    if (action.includes('settings')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getTargetLabel = (log) => {
    const details = log.details || {};
    if (details.email) return details.email;
    if (details.username) return details.username;
    if (log.target_type === 'system') return 'System Settings';
    return `${log.target_type}: ${log.target_id?.slice(0, 12)}...`;
  };

  const getDetailsSummary = (log) => {
    const details = log.details || {};
    const parts = [];
    if (details.email) parts.push(details.email);
    if (details.initial_usdc_balance) parts.push(`USDC: ${details.initial_usdc_balance}`);
    if (details.total_fees) parts.push(`Fees: ${details.total_fees}`);
    if (details.freeze_type) parts.push(`Freeze: ${details.freeze_type}`);
    if (details.username) parts.push(details.username);
    if (details.email_type) parts.push(`Type: ${details.email_type}`);
    if (details.resend_api_key) parts.push('API key updated');
    if (parts.length === 0) {
      const keys = Object.keys(details).slice(0, 3);
      keys.forEach(k => {
        const v = details[k];
        if (v !== null && v !== undefined && typeof v !== 'object') {
          parts.push(`${k}: ${String(v).slice(0, 30)}`);
        }
      });
    }
    return parts.join(' · ') || 'No details';
  };

  const formatDetailValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <AdminLayout title="Audit Logs">
      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="user_created">User Created</SelectItem>
            <SelectItem value="user_updated">User Updated</SelectItem>
            <SelectItem value="user_deleted">User Deleted</SelectItem>
            <SelectItem value="kyc_approved">KYC Approved</SelectItem>
            <SelectItem value="kyc_rejected">KYC Rejected</SelectItem>
            <SelectItem value="wallet_balance_adjusted">Balance Adjusted</SelectItem>
            <SelectItem value="transaction_created">Transaction Created</SelectItem>
            <SelectItem value="email_sent">Email Sent</SelectItem>
            <SelectItem value="settings_updated">Settings Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                    data-testid={`audit-log-row-${log.id}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {log.admin_email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                      {getTargetLabel(log)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-sm truncate">
                      {getDetailsSummary(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Badge className={getActionBadgeColor(selectedLog?.action || '')}>
                {selectedLog?.action?.replace(/_/g, ' ')}
              </Badge>
              <span className="text-gray-500 text-sm font-normal">
                {selectedLog && new Date(selectedLog.created_at).toLocaleString('en-GB')}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 mt-2">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Admin</p>
                  <p className="text-sm font-medium text-gray-800">{selectedLog.admin_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Target</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedLog.target_type}: {selectedLog.target_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Log ID</p>
                  <p className="text-sm text-gray-600 font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Time</p>
                  <p className="text-sm text-gray-600">{new Date(selectedLog.created_at).toLocaleString('en-GB')}</p>
                </div>
              </div>

              {/* Full Details */}
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Full Details</p>
                <div className="bg-white border rounded-lg divide-y">
                  {Object.entries(selectedLog.details || {}).map(([key, value]) => (
                    <div key={key} className="flex px-4 py-2.5">
                      <span className="text-sm font-medium text-gray-600 w-48 shrink-0">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-800 break-all">
                        {formatDetailValue(value)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(selectedLog.details || {}).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No details available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
