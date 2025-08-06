import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Settings,
  AlertTriangle,
  TrendingUp,
  Mail,
  Loader2,
  Upload
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'report_approved' | 'report_rejected' | 'report_submitted' | 'kpi_updated' | 'system' | 'user_activity' | 'report_processing' | 'report_completed' | 'report_error' | 'report_pending_approval';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  related_report_id?: string;
  user_id: string;
}

interface NotificationCenterProps {
  userRole: 'admin' | 'sbu';
}

const NotificationCenter = ({ userRole }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Get current user ID and fetch notifications
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await fetchNotifications(session.user.id);
      }
      setIsLoading(false);
    };

    getCurrentUser();
  }, []);

  // Fetch notifications from database
  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: "Gagal memuat notifikasi",
          description: "Terjadi kesalahan saat memuat notifikasi",
          variant: "destructive"
        });
        return;
      }

      setNotifications((data as Notification[]) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!currentUserId) return;

    console.log('Setting up real-time notification subscription for user:', currentUserId);

    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('New notification received:', payload.new);
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Notification updated:', payload.new);
          const updatedNotification = payload.new as Notification;
          
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === updatedNotification.id ? updatedNotification : notif
            )
          );
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'report_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'report_submitted':
      case 'report_pending_approval':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'report_processing':
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'report_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'report_error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'kpi_updated':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-orange-600" />;
      case 'user_activity':
        return <User className="h-4 w-4 text-indigo-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityFromType = (type: string) => {
    switch (type) {
      case 'report_approved':
      case 'report_rejected':
      case 'report_error':
        return 'high';
      case 'report_processing':
      case 'report_completed':
      case 'report_submitted':
      case 'report_pending_approval':
      case 'success':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getPriorityBadge = (type: string) => {
    const priority = getPriorityFromType(type);
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Tinggi</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Sedang</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Rendah</Badge>;
      default:
        return null;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as unread:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: false }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotificationIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadNotificationIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadNotificationIds);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast({
        title: "Semua notifikasi ditandai sudah dibaca",
        description: `${unreadCount} notifikasi telah ditandai sebagai sudah dibaca`,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`;
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`;
    } else {
      return "Baru saja";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifikasi
            {unreadCount > 0 && (
              <Badge className="bg-red-600 text-white">{unreadCount}</Badge>
            )}
            <div className="flex items-center gap-1 text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </h1>
          <p className="text-muted-foreground">
            Kelola dan pantau notifikasi sistem real-time
            {userRole === 'sbu' && (
              <span className="block text-sm text-primary font-medium">
                Notifikasi khusus untuk pengguna SBU
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
          >
            {filter === 'all' ? 'Tampilkan Belum Dibaca' : 'Tampilkan Semua'}
          </Button>
          {unreadCount > 0 && (
            <Button 
              variant="hero" 
              size="sm"
              onClick={markAllAsRead}
            >
              Tandai Semua Sudah Dibaca
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              Semua ({notifications.length})
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Belum Dibaca ({unreadCount})
            </Button>
            <Button 
              variant={filter === 'read' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('read')}
            >
              Sudah Dibaca ({notifications.length - unreadCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Notifikasi</CardTitle>
          <CardDescription>
            Menampilkan {filteredNotifications.length} notifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1 p-4">
              {filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      !notification.is_read 
                        ? 'bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {getPriorityBadge(notification.type)}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.created_at)}
                            {notification.related_report_id && (
                              <>
                                <span>•</span>
                                <span>ID: {notification.related_report_id}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {notification.is_read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsUnread(notification.id);
                            }}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredNotifications.length - 1 && <Separator />}
                </div>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
                  </h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' 
                      ? 'Semua notifikasi telah dibaca'
                      : 'Belum ada notifikasi yang masuk'
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;