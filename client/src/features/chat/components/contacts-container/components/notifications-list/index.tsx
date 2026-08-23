import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getColor, getImageUrl } from "@/lib/utils";
import moment from "moment";

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const { userInfo, setSelectedChatType, setSelectedChatData } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get("/api/v1/notifications", {
          withCredentials: true,
        });
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    
    // Using custom event listener if we dispatch it from SocketContext
    const onSocketNotification = (e: any) => handleNewNotification(e.detail);
    window.addEventListener("new-notification", onSocketNotification);
    return () => window.removeEventListener("new-notification", onSocketNotification);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleNotificationClick = async (notif: any) => {
    // Mark as read
    try {
      if (!notif.isRead) {
        await apiClient.post("/api/v1/notifications/mark-read", {
          notificationIds: [notif._id],
        }, { withCredentials: true });
        setNotifications((prev) =>
          prev.map((n: any) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error(error);
    }

    // Navigate
    if (notif.channelId) {
      setSelectedChatType("channel");
      setSelectedChatData(notif.channelId);
    } else {
      setSelectedChatType("contact");
      setSelectedChatData(notif.sender);
    }
    setIsOpen(false);
  };

  const clearAll = async () => {
    try {
      await apiClient.delete("/api/v1/notifications", { withCredentials: true });
      setNotifications([]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative px-5 mb-5">
      <button 
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiBell className="text-xl" />
        <span className="text-sm font-semibold tracking-wider uppercase">Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto bg-[#8417ff] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-10 left-5 right-5 bg-[#1b1c24] border border-[#2f303b] rounded-lg shadow-2xl z-50 max-h-[50vh] overflow-y-auto">
          <div className="flex justify-between items-center p-3 border-b border-[#2f303b]">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Recent</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-xs text-[#8417ff] hover:underline">
                Clear All
              </button>
            )}
          </div>
          
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center text-xs text-neutral-500 py-4">No notifications</div>
            ) : (
              notifications.map((notif: any) => (
                <div 
                  key={notif._id} 
                  className={`p-3 rounded cursor-pointer transition-colors border-b border-[#2f303b]/50 last:border-0 ${notif.isRead ? 'opacity-60 hover:bg-[#2f303b]' : 'bg-[#2f303b]/50 hover:bg-[#2f303b]'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Avatar className="h-6 w-6">
                      {notif.sender.image ? (
                        <AvatarImage src={getImageUrl(notif.sender.image)} />
                      ) : (
                        <AvatarFallback className={`text-[10px] ${getColor(notif.sender.color)}`}>
                          {notif.sender.firstName ? notif.sender.firstName[0] : notif.sender.email[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-xs font-bold text-white/90">
                      {notif.sender.firstName || notif.sender.email}
                    </span>
                    <span className="text-[10px] text-neutral-500 ml-auto">
                      {moment(notif.createdAt).fromNow()}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 ml-9">
                    {notif.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
