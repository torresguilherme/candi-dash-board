import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CandidateAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getColorFromName = (name: string) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

export const CandidateAvatar = ({ name, photoUrl, size = "md" }: CandidateAvatarProps) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={photoUrl || undefined} alt={name} />
      <AvatarFallback className={`${getColorFromName(name)} text-white font-medium`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
