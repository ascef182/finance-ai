"use client";

import { addDays, differenceInDays } from "date-fns";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { addToGoal } from "@/app/_actions/add-to-goal";
import { deleteGoal } from "@/app/_actions/delete-goal";
import { MoneyInput } from "@/app/_components/money-input";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Progress } from "@/app/_components/ui/progress";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import { getGoals } from "@/app/_data/get-goals";

import UpsertGoalDialog from "./upsert-goal-dialog";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getMotivationalMessage = (pct: number): string => {
  if (pct >= 75) return "Quase lá!";
  if (pct >= 50) return "Na metade do caminho!";
  if (pct >= 25) return "Bom progresso!";
  return "Começando bem!";
};

const getEstimatedCompletion = (
  current: number,
  target: number,
  createdAt: Date,
): string | null => {
  const days = differenceInDays(new Date(), new Date(createdAt));
  if (days <= 0 || current <= 0 || current >= target) return null;
  const dailyRate = current / days;
  if (dailyRate <= 0) return null;
  const remaining = Math.ceil((target - current) / dailyRate);
  return addDays(new Date(), remaining).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

type SerializedGoal = Awaited<ReturnType<typeof getGoals>>[number];

interface GoalCardProps {
  goal: SerializedGoal;
}

const GoalCard = ({ goal }: GoalCardProps) => {
  const [editIsOpen, setEditIsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddAmount, setQuickAddAmount] = useState<number>(0);
  const [isDeleting, startDelete] = useTransition();
  const [isAdding, startAdd] = useTransition();

  const current = goal.currentAmount;
  const target = goal.targetAmount;
  const percentage =
    target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  const isOverdue =
    goal.deadline != null &&
    percentage < 100 &&
    new Date(goal.deadline) < new Date();

  const estimatedCompletion = getEstimatedCompletion(
    current,
    target,
    goal.createdAt,
  );

  const handleDelete = () => {
    startDelete(async () => {
      try {
        await deleteGoal(goal.id);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleQuickAdd = () => {
    if (!quickAddAmount || quickAddAmount <= 0) return;
    startAdd(async () => {
      try {
        await addToGoal({ goalId: goal.id, amount: quickAddAmount });
        setQuickAddAmount(0);
        setQuickAddOpen(false);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <>
      <Card className={isOverdue ? "border-red-500" : undefined}>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">{goal.name}</CardTitle>
          <div className="flex shrink-0 items-center gap-1">
            <Popover open={quickAddOpen} onOpenChange={setQuickAddOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary"
                  disabled={percentage >= 100}
                >
                  <PlusIcon size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-3" align="end">
                <p className="text-sm font-medium">Adicionar à meta</p>
                <MoneyInput
                  placeholder="Valor a adicionar..."
                  value={quickAddAmount}
                  onValueChange={({ floatValue }) =>
                    setQuickAddAmount(floatValue ?? 0)
                  }
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleQuickAdd}
                  disabled={isAdding || !quickAddAmount}
                >
                  Confirmar
                </Button>
              </PopoverContent>
            </Popover>

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

          {percentage >= 100 ? (
            <Badge className="w-fit animate-bounce bg-primary text-primary-foreground">
              Meta atingida!
            </Badge>
          ) : (
            <p className="text-xs font-medium text-primary">
              {getMotivationalMessage(percentage)}
            </p>
          )}

          {estimatedCompletion && (
            <p className="text-xs text-muted-foreground">
              Conclusão estimada: {estimatedCompletion}
            </p>
          )}

          {goal.category && (
            <p className="text-xs text-muted-foreground">
              Categoria: {TRANSACTION_CATEGORY_LABELS[goal.category]}
            </p>
          )}
          {goal.deadline && (
            <p
              className={`text-xs ${isOverdue ? "font-medium text-red-500" : "text-muted-foreground"}`}
            >
              {isOverdue ? "Prazo expirado: " : "Prazo: "}
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
