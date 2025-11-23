import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, ShoppingCart, Sparkles } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/shop");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ShoppingBag className="w-16 h-16 text-primary" />
            <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ShopCart
            </h1>
          </div>

          <p className="text-2xl text-muted-foreground mb-12">
            Your favorite online shopping destination
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-md">
              <Package className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
              <p className="text-muted-foreground">
                Browse through our curated collection of products
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-md">
              <ShoppingCart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
              <p className="text-muted-foreground">
                Add items to cart with a single click
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-md">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fast Checkout</h3>
              <p className="text-muted-foreground">
                Complete your purchase in seconds
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
