import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getInitials, formatPercentage } from "@/lib/utils";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  jobTitle: string;
  eventsAttended: number;
  volunteerHours: number;
  attendanceRate: number;
  department: { name: string };
}

interface TopVolunteersProps {
  volunteers: Volunteer[];
}

const medals = ["🥇", "🥈", "🥉"];

export function TopVolunteers({ volunteers }: TopVolunteersProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Top Volunteers</CardTitle>
          <CardDescription>Most active employees this period</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employees" className="flex items-center gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {volunteers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No volunteer data yet</p>
          </div>
        ) : (
          volunteers.map((vol, index) => (
            <Link
              key={vol.id}
              href={`/employees/${vol.id}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40 group"
            >
              <span className="text-sm w-5 shrink-0">
                {index < 3 ? medals[index] : <span className="text-muted-foreground">{index + 1}</span>}
              </span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className="text-xs text-white font-semibold"
                  style={{ backgroundColor: vol.avatarColor }}
                >
                  {getInitials(`${vol.firstName} ${vol.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {vol.firstName} {vol.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{vol.department.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{vol.eventsAttended}</p>
                <p className="text-xs text-muted-foreground">events</p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
