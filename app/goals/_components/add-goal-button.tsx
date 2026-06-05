"use client";

import { PiggyBankIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";

import UpsertGoalDialog from "./upsert-goal-dialog";

const AddGoalButton = () => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        className="rounded-full font-bold"
        onClick={() => setDialogIsOpen(true)}
      >
        Adicionar meta
        <PiggyBankIcon />
      </Button>
      <UpsertGoalDialog isOpen={dialogIsOpen} setIsOpen={setDialogIsOpen} />
    </>
  );
};

export default AddGoalButton;
