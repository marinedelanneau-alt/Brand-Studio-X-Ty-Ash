import type { ExerciseType } from "@/lib/exercise-types";
import type { SmartFeedbackConfig } from "@/lib/smart-feedback";

export type BrandProject = {
  id: number;
  account_id: number;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandModule = {
  id: number;
  title: string;
  position: number;
  video_url: string;
  audio_url: string | null;
  content_html: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandSubmodule = {
  id: number;
  module_id: number;
  title: string;
  position: number;
  video_url: string;
  audio_url: string | null;
  content_html: string;
  created_at: string;
  updated_at: string;
};

export type ModuleExercise = {
  id: number;
  module_id: number;
  submodule_id: number | null;
  position: number;
  type: ExerciseType;
  explanation: string;
  answer_placeholder: string;
  audio_url: string | null;
  question: string;
  options: string[];
  exercise_group_id?: string | null;
  feedback_config?: SmartFeedbackConfig | null;
};

export type ModuleExerciseGroup = {
  id: string;
  position: number;
  questions: ModuleExercise[];
};

export type ModuleProgress = {
  answeredCount: number;
  exerciseCount: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  completionPercent: number;
};

export type WorkspaceModule = BrandModule & {
  submodules: Array<
    BrandSubmodule & {
      exercises: ModuleExercise[];
    }
  >;
  exercises: ModuleExercise[];
  answers: Record<number, string[]>;
  progress: ModuleProgress;
};

export type AdminOverview = {
  accountCount: number;
  adminCount: number;
  projectCount: number;
  moduleCount: number;
  publishedModuleCount: number;
  answerCount: number;
};

export type AdminAccountSummary = {
  id: number;
  email: string;
  client_name: string | null;
  company_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  project_name: string | null;
};
