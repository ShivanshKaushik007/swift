import { useAppStore } from "@/store";
import { Avatar, AvatarImage } from "./ui/avatar";
import { HOST } from "@/utils/constants";
import { getColor } from "@/lib/utils";
import moment from "moment";

const ContactList = ({ contacts, isChannel = false }) => {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    selectedChatType,
    setSelectedChatMessages,
  } = useAppStore();

  const handleClick = (contact) => {
    if (isChannel) setSelectedChatType("channel");
    else setSelectedChatType("contact");
    setSelectedChatData(contact);
    if (selectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }
  };

  return (
    <div className="mt-5">
      {contacts.map((contact) => {
        const isSelected = selectedChatData && selectedChatData._id === contact._id;
        
        return (
        <div
          key={contact._id}
          className={`pl-10 py-2 transition-all duration-300 cursor-pointer ${
            isSelected
              ? " bg-[#8417ff] hover:bg-[#8417ff]"
              : "hover:bg-[#f1f1f111] "
          } `}
          onClick={() => handleClick(contact)}
        >
          <div className="flex gap-4 items-center justify-start text-neutral-300 w-full">
            {!isChannel && (
              <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                {contact.image ? (
                  <AvatarImage
                    src={`${HOST}/${contact.image}`}
                    alt="profile"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={` 
                        ${
                          isSelected
                            ? "bg-[#ffffff22] border border-white/70 "
                            : getColor(contact.color)
                        }
                        uppercase h-10 w-10  text-lg border-[1px] flex items-center justify-center rounded-full`}
                  >
                    {contact.firstName
                      ? contact.firstName.split("").shift()
                      : contact.email.split("").shift()}
                  </div>
                )}
              </Avatar>
            )}
            {isChannel && (
              <div className="bg-[#ffffff22] h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full   ">
                #
              </div>
            )}
            <div className="flex flex-col w-full overflow-hidden">
              <div className="flex justify-between items-center w-full">
                <span className="truncate max-w-[150px]">
                  {isChannel ? contact.name : (contact.firstName ? `${contact.firstName} ${contact.lastName}` : contact.email)}
                </span>
                
                {contact.lastMessageTime && (
                  <span className={`text-[10px] flex-shrink-0 ml-2 mr-5 ${isSelected ? "text-white/80" : "text-neutral-500"}`}>
                    {moment(contact.lastMessageTime).format("LT")}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center w-full mt-0.5">
                <span className={`text-xs truncate max-w-[180px] ${isSelected ? "text-white/90" : "text-neutral-500"}`}>
                  {contact.lastMessageType === "file" 
                    ? "File attachment" 
                    : (contact.lastMessageContent || "No messages yet")}
                </span>
                
                {contact.unreadCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mr-5 ${isSelected ? "bg-white text-[#8417ff]" : "bg-[#8417ff] text-white"}`}>
                    {contact.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )})}
    </div>
  );
};

export default ContactList;
