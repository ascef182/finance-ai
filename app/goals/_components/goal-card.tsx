"use client";

import { Goal } from "@prisma/client";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteGoal } from "@/app/_actions/delete-goal";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";

import UpsertGoalDialog from "./upsert-goal-dialog";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface GoalCardProps {
  goal: Goal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const [editIsOpen, setEditIsOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const percentage =
    target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  const handleDelete = () => {
    startDelete(async () => {
      try {
        await deleteGoal(goal.id);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">{goal.name}</CardTitle>
          <div className="space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={() => setEditIsOpen(true)}
            >
              <PencilIcon size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <TrashIcon size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={percentage} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(current)} de {formatCurrency(target)}
            </span>
            <span className="font-bold">{percentage}%</span>
          </div>
          {goal.category && (
            <p className="text-xs text-muted-foreground">
              Categoria: {TRANSACTION_CATEGORY_LABELS[goal.category]}
            </p>
          )}
          {goal.deadline && (
            <p className="text-xs text-muted-foreground">
              Prazo:{" "}
              {new Date(goal.deadline).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <UpsertGoalDialog
        isOpen={editIsOpen}
        setIsOpen={setEditIsOpen}
        goalId={goal.id}
        defaultValues={{
          name: goal.name,
          targetAmount: target,
          currentAmount: current,
          category: goal.category ?? undefined,
          deadline: goal.deadline ?? undefined,
        }}
      />
    </>
  );
};

export default GoalCard;
