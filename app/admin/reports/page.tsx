'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Ban, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface Report {
  id: string
  reason: string
  description: string | null
  created_at: string
  reporter: {
    user_id: string
    name: string
    avatar_url: string | null
  }
  reported: {
    user_id: string
    name: string
    avatar_url: string | null
  }
}

const reasonLabels: Record<string, { label: string; color: string }> = {
  inappropriate_behavior: { label: 'Inappropriate Behavior', color: 'bg-red-100 text-red-700' },
  suspicious_activity: { label: 'Suspicious Activity', color: 'bg-yellow-100 text-yellow-700' },
  fake_profile: { label: 'Fake Profile', color: 'bg-orange-100 text-orange-700' },
  harassment: { label: 'Harassment', color: 'bg-red-100 text-red-700' },
  spam: { label: 'Spam', color: 'bg-blue-100 text-blue-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 20

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })

      const response = await fetch(`/api/admin/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [page])

  const handleDismiss = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/reports?reportId=${selectedReport.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReports(reports.filter(r => r.id !== selectedReport.id))
        setDismissDialogOpen(false)
        setSelectedReport(null)
      }
    } catch (err) {
      console.error('Error dismissing report:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBanAndDismiss = async () => {
    if (!selectedReport) return
    setActionLoading(true)

    try {
      // First ban the user
      const banResponse = await fetch(`/api/admin/users/${selectedReport.reported.user_id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `Banned due to report: ${selectedReport.reason}` }),
      })

      if (banResponse.ok) {
        // Then dismiss the report
        await fetch(`/api/admin/reports?reportId=${selectedReport.id}`, {
          method: 'DELETE',
        })

        setReports(reports.filter(r => r.id !== selectedReport.id))
        setBanDialogOpen(false)
        setSelectedReport(null)
      }
    } catch (err) {
      console.error('Error banning user:', err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-500">Review and handle user reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Pending Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No pending reports</h3>
              <p className="text-gray-500 mt-1">All reports have been handled</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reports.map((report) => {
                  const reasonInfo = reasonLabels[report.reason] || reasonLabels.other
                  return (
                    <div 
                      key={report.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          {/* Reporter and reported */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={report.reporter?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {report.reporter?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {report.reporter?.name || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-gray-400">reported</span>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={report.reported?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {report.reported?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-red-600">
                                {report.reported?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>

                          {/* Reason badge and description */}
                          <div className="space-y-2">
                            <Badge className={reasonInfo.color}>
                              {reasonInfo.label}
                            </Badge>
                            {report.description && (
                              <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                                "{report.description}"
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              Reported {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report)
                              setDismissDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report)
                              setBanDialogOpen(true)
                            }}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Ban User
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {page * limit + 1} to {page * limit + reports.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={reports.length < limit}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dismiss Dialog */}
      <AlertDialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss this report? This means no action will be taken against {selectedReport?.reported?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDismiss}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dismiss Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {selectedReport?.reported?.name}? 
              They will not be able to access the app and this report will be dismissed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanAndDismiss}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
