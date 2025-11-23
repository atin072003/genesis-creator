import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShoppingBag, ShoppingCart, History, LogOut, Package } from "lucide-react";

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: string;
}

interface CartItem {
  id: string;
  item_id: string;
  items: {
    name: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total: number;
}

export default function Shop() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadItems();
      loadOrCreateCart();
    }
  }, [user]);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load items");
      return;
    }

    setItems(data || []);
  };

  const loadOrCreateCart = async () => {
    if (!user) return;

    // Try to get existing active cart
    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingCart) {
      setCartId(existingCart.id);
    } else {
      // Create new cart
      const { data: newCart, error } = await supabase
        .from("carts")
        .insert([{ user_id: user.id, status: "active" }])
        .select()
        .single();

      if (error) {
        toast.error("Failed to create cart");
        return;
      }

      setCartId(newCart.id);
    }
  };

  const addToCart = async (itemId: string) => {
    if (!cartId || !user) return;

    setAddingToCart(itemId);

    // Check if item already in cart
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id")
      .eq("cart_id", cartId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (existing) {
      toast.info("Item already in cart");
      setAddingToCart(null);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .insert([{ cart_id: cartId, item_id: itemId, quantity: 1 }]);

    if (error) {
      toast.error("Failed to add item to cart");
    } else {
      toast.success("Added to cart!");
    }

    setAddingToCart(null);
  };

  const viewCart = async () => {
    if (!cartId) return;

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        item_id,
        items (name)
      `)
      .eq("cart_id", cartId);

    if (error) {
      toast.error("Failed to load cart");
      return;
    }

    const cartItems = data as unknown as CartItem[];
    
    if (cartItems.length === 0) {
      toast.info("Your cart is empty");
      return;
    }

    const itemsList = cartItems
      .map((ci) => ci.items.name)
      .join(", ");

    toast.info(`Cart Items: ${itemsList}`, {
      duration: 5000,
    });
  };

  const viewOrderHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load order history");
      return;
    }

    const orders = data as Order[];

    if (orders.length === 0) {
      toast.info("No orders yet");
      return;
    }

    const ordersList = orders
      .map((o) => `Order #${o.id.slice(0, 8)} - $${o.total}`)
      .join("\n");

    toast.info(`Order History:\n${ordersList}`, {
      duration: 5000,
    });
  };

  const checkout = async () => {
    if (!cartId || !user) return;

    setCheckingOut(true);

    // Get cart items with prices
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        item_id,
        quantity,
        items (price)
      `)
      .eq("cart_id", cartId);

    if (cartError || !cartItems || cartItems.length === 0) {
      toast.error("Cart is empty");
      setCheckingOut(false);
      return;
    }

    // Calculate total
    const total = cartItems.reduce((sum, item: any) => {
      return sum + (item.items.price * item.quantity);
    }, 0);

    // Create order
    const { error: orderError } = await supabase
      .from("orders")
      .insert([{
        user_id: user.id,
        cart_id: cartId,
        total: total,
        status: "completed",
      }]);

    if (orderError) {
      toast.error("Failed to create order");
      setCheckingOut(false);
      return;
    }

    // Mark cart as checked out
    await supabase
      .from("carts")
      .update({ status: "checked_out" })
      .eq("id", cartId);

    // Create new cart
    const { data: newCart } = await supabase
      .from("carts")
      .insert([{ user_id: user.id, status: "active" }])
      .select()
      .single();

    if (newCart) {
      setCartId(newCart.id);
    }

    toast.success("Order successful!");
    setCheckingOut(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <header className="bg-card border-b border-border/50 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">ShopCart</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={viewCart}
                className="gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={viewOrderHistory}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                Orders
              </Button>

              <Button
                onClick={checkout}
                disabled={checkingOut}
                className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <Package className="w-4 h-4" />
                {checkingOut ? "Processing..." : "Checkout"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Discover Products</h2>
          <p className="text-muted-foreground">Click on any item to add it to your cart</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => addToCart(item.id)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-xl">{item.name}</CardTitle>
                {item.description && (
                  <CardDescription>{item.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  ${item.price.toFixed(2)}
                </p>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={addingToCart === item.id}
                >
                  {addingToCart === item.id ? "Adding..." : "Add to Cart"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items available</h3>
            <p className="text-muted-foreground">Check back later for new products!</p>
          </div>
        )}
      </main>
    </div>
  );
}
