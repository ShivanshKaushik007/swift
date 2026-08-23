import { useState, useRef, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constants";
import moment from "moment";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({ users: [], channels: [], messages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { setSelectedChatType, setSelectedChatData } = useAppStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.trim().length === 0) {
        setResults({ users: [], channels: [], messages: [] });
        return;
      }
      setIsSearching(true);
      try {
        const response = await apiClient.get(`/api/v1/search?query=${encodeURIComponent(query)}`, {
          withCredentials: true,
        });
        setResults(response.data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      if (query.length > 0) search();
    }, 500);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleUserClick = (user: any) => {
    setIsOpen(false);
    setSelectedChatType("contact");
    setSelectedChatData(user);
    setQuery("");
  };

  const handleChannelClick = (channel: any) => {
    setIsOpen(false);
    setSelectedChatType("channel");
    setSelectedChatData(channel);
    setQuery("");
  };

  const handleMessageClick = (msg: any) => {
    setIsOpen(false);
    if (msg.channelId) {
      setSelectedChatType("channel");
      setSelectedChatData(msg.channelId);
    } else {
      setSelectedChatType("contact");
      // Find the other person
      const isSender = msg.sender._id === useAppStore.getState().userInfo.id;
      setSelectedChatData(isSender ? msg.recipient : msg.sender);
    }
    setQuery("");
  };

  return (
    <div className="px-5 mb-5 relative" ref={searchRef}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { if(query.length > 0) setIsOpen(true); }}
          className="w-full bg-[#2f303b] text-white/80 placeholder-neutral-400 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-[#8417ff]"
        />
        {query && (
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
            onClick={() => { setQuery(""); setIsOpen(false); }}
          >
            <FiX />
          </button>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-12 left-5 right-5 bg-[#1b1c24] border border-[#2f303b] rounded-lg shadow-2xl z-[100] max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-neutral-400">Searching...</div>
          ) : (
            <div className="p-2">
              {results.users.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider px-2">Users</div>
                  {results.users.map((user: any) => (
                    <div 
                      key={user._id} 
                      className="flex items-center gap-3 p-2 hover:bg-[#2f303b] rounded cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user)}
                    >
                      <Avatar className="h-8 w-8">
                        {user.image ? (
                          <AvatarImage src={`${HOST}/${user.image}`} alt="profile" className="object-cover" />
                        ) : (
                          <AvatarFallback className={`uppercase text-xs ${getColor(user.color)}`}>
                            {user.firstName ? user.firstName[0] : user.email[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm text-white/90">
                        {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {results.channels.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider px-2">Channels</div>
                  {results.channels.map((channel: any) => (
                    <div 
                      key={channel._id} 
                      className="flex items-center gap-3 p-2 hover:bg-[#2f303b] rounded cursor-pointer transition-colors"
                      onClick={() => handleChannelClick(channel)}
                    >
                      <div className="h-8 w-8 bg-[#27272a] text-[#8417ff] flex items-center justify-center rounded-full text-sm font-bold">
                        #
                      </div>
                      <div className="text-sm text-white/90">{channel.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.messages.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider px-2">Messages</div>
                  {results.messages.map((msg: any) => (
                    <div 
                      key={msg._id} 
                      className="p-2 hover:bg-[#2f303b] rounded cursor-pointer transition-colors border-b border-[#2f303b]/50 last:border-0"
                      onClick={() => handleMessageClick(msg)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#8417ff] font-semibold">
                           {msg.sender.firstName || msg.sender.email}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {moment(msg.timestamp).format("MMM D, HH:mm")}
                        </span>
                      </div>
                      <div className="text-sm text-white/80 truncate">
                        {msg.messageType === "text" ? msg.content : "File attachment"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.users.length === 0 && results.channels.length === 0 && results.messages.length === 0 && (
                <div className="p-4 text-center text-sm text-neutral-400">No results found for "{query}"</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
