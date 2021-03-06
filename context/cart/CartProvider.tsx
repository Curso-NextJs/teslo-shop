import { FC, ReactNode, useEffect, useReducer } from 'react';
import { CartContext, cartReducer } from './';
import { ICartProduct } from '../../interfaces';
import Cookie from 'js-cookie';

export interface CartState {
	cart: ICartProduct[];
	numberOfItems: number;
	subTotal: number;
	tax: number;
	total: number;
}

const CART_INITIAL_STATE: CartState = {
	cart: Cookie.get('cart') ? JSON.parse(Cookie.get('cart')!) : [],
	numberOfItems: 0,
	subTotal: 0,
	tax: 0,
	total: 0,
};

interface Props {
	children?: ReactNode;
}

export const CartProvider: FC<Props> = ({ children }) => {
	const [state, dispatch] = useReducer(cartReducer, CART_INITIAL_STATE);

	useEffect(() => {
		try {
			const cookieProducts = Cookie.get('cart')
				? JSON.parse(Cookie.get('cart')!)
				: [];
			dispatch({
				type: '[CART] - LoadCart from cookies | storage',
				payload: cookieProducts,
			});
		} catch (error) {
			dispatch({
				type: '[CART] - LoadCart from cookies | storage',
				payload: [],
			});
		}
	}, []);

	useEffect(() => {
		Cookie.set('cart', JSON.stringify(state.cart));
	}, [state.cart]);

	useEffect(() => {
		const numberOfItems = state.cart.reduce(
			(prev, current) => current.quantity + prev,
			0
		);
		const subTotal = state.cart.reduce(
			(prev, current) => current.price * current.quantity + prev,
			0
		);

		const taxRate = Number(process.env.NEXT_PUBLIC_TAX_RATE || 0);

		const orderSummary = {
			numberOfItems,
			subTotal,
			tax: subTotal * taxRate,
			total: Math.round(subTotal * (taxRate + 1) * 100) / 100,
		};

		dispatch({ type: '[CART] - Update order summary', payload: orderSummary });
	}, [state.cart]);

	const addProductToCart = (product: ICartProduct) => {
		const productInCart = state.cart.some(p => p._id === product._id);

		if (!productInCart) {
			return dispatch({
				type: '[CART] - Update products in cart',
				payload: [...state.cart, product],
			});
		}

		const productInCartButDifferentSize = state.cart.some(
			p => p._id === product._id && p.size === product.size
		);
		if (!productInCartButDifferentSize) {
			return dispatch({
				type: '[CART] - Update products in cart',
				payload: [...state.cart, product],
			});
		}

		const updatedProducts = state.cart.map(p => {
			if (p._id === product._id && p.size === product.size) {
				p.quantity += product.quantity;
			}
			return p;
		});

		return dispatch({
			type: '[CART] - Update products in cart',
			payload: updatedProducts,
		});
	};

	const updateCartQuantity = (product: ICartProduct) => {
		dispatch({
			type: '[CART] - Change cart quantity',
			payload: product,
		});
	};

	const removeCartProduct = (product: ICartProduct) => {
		dispatch({
			type: '[CART] - Remove product in cart',
			payload: product,
		});
	};

	return (
		<CartContext.Provider
			value={{
				...state,
				addProductToCart,
				updateCartQuantity,
				removeCartProduct,
			}}>
			{children}
		</CartContext.Provider>
	);
};
