import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Navbar from "../_components/navbar";
import { ScrollArea } from "../_components/ui/scroll-area";
import { getGoals } from "../_data/get-goals";
import AddGoalButton from "./_components/add-goal-button";
import GoalCard from "./_components/goal-card";

const GoalsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const goals = await getGoals();
  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Metas</h1>
          <AddGoalButton />
        </div>
        <ScrollArea className="h-full">
          {goals.length === 0 ? (
            <p className="text-muted-foreground">
              Você ainda não tem metas. Crie a primeira!
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
};

export default GoalsPage;
