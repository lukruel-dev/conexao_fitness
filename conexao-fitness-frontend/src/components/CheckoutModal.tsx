import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

// Certifique-se de ter essa chave no seu arquivo .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock');

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Impede o redirecionamento caso o método de pagamento não exija
    });

    if (error) {
      setErrorMessage(error.message ?? 'Ocorreu um erro desconhecido.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setIsProcessing(false);
      onSuccess();
    } else {
      // Outros status como processing
      setIsProcessing(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement />
      {errorMessage && <div className="text-destructive text-sm mt-2">{errorMessage}</div>}
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isProcessing || !stripe || !elements}>
          {isProcessing ? 'Processando...' : 'Pagar Agora'}
        </Button>
      </div>
    </form>
  );
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string | null;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, clientSecret, onSuccess }) => {
  const [isProcessingMock, setIsProcessingMock] = useState(false);

  if (!clientSecret || !isOpen) return null;

  const isMock = clientSecret.includes("mock") || !import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  const handleSimulatePayment = () => {
    setIsProcessingMock(true);
    setTimeout(() => {
      setIsProcessingMock(false);
      onSuccess();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Finalizar Pagamento com Cartão</DialogTitle>
        </DialogHeader>
        {isMock ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground space-y-2">
              <p className="font-semibold text-sm text-primary">💳 Modo de Teste / Sandbox Ativo</p>
              <p>Você pode testar a recarga do saldo da sua carteira digital instantaneamente neste ambiente de demonstração.</p>
              <div className="bg-background/80 p-3 rounded-lg border text-muted-foreground font-mono text-xs">
                <div>Cartão: •••• •••• •••• 4242</div>
                <div>Status: Pronto para autorizar recarga</div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={isProcessingMock}>
                Cancelar
              </Button>
              <Button type="button" variant="hero" onClick={handleSimulatePayment} disabled={isProcessingMock}>
                {isProcessingMock ? 'Confirmando...' : 'Confirmar Recarga de Teste'}
              </Button>
            </div>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm onSuccess={onSuccess} onCancel={onClose} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};
