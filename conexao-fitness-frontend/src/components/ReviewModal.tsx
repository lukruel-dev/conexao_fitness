import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/services/reviews";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  serviceName?: string;
  onSuccess?: () => void;
}

const ReviewModal = ({ open, onOpenChange, bookingId, serviceName, onSuccess }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => createReview({ bookingId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      onSuccess?.();
      onOpenChange(false);
      setRating(0);
      setComment("");
    },
    onError: (err: Error) => toast.error("Erro ao enviar avaliação", { description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar aula</DialogTitle>
          <DialogDescription>
            {serviceName ? `Como foi sua experiência com ${serviceName}?` : "Como foi sua experiência?"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${filled ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                />
              </button>
            );
          })}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Deixe um comentário (opcional)"
          rows={4}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="hero"
            onClick={() => mutation.mutate()}
            disabled={rating === 0 || mutation.isPending}
          >
            {mutation.isPending ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
