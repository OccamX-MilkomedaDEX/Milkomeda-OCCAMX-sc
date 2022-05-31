# Find swap amount for Zap feature


## Exact solution
- In the beginning we have $reserveA, reserveB$ and we want to zap $amountA$, which will be split into $swapA + liquidA$
- The trade volume after fee is $0.997 * swapA$, so the output amount of token B is:


\begin{align}
liquidB &= reserveB - \frac{reserveA * reserveB}{reserveA + 0.997 * swapA} \\
&= \frac{0.997 * swapA * reserveB}{reserveA + 0.997 * swapA}
\end{align}

- After the trade the new reserves are:

\begin{align*}
newReserveA &= reserveA + swapA \\
newReserveB &= \frac{reserveA * reserveB}{reserveA + 0.997 * swapA}
\end{align*}

- In order to fully provide liquidity the ratio of the input amounts must be the same as the ratio of the new reserves, i.e.

\begin{align*}
liquidA : liquidB &= newReserveA : newReserveB \\
(inputA - swapA) : \frac{0.997 * swapA * reserveB}{reserveA + 0.997 * swapA} &= \\
(reserveA + swapA) &: \frac{reserveA * reserveB}{reserveA + 0.997 * swapA} \\
\frac{inputA - swapA}{0.997 * swapA} &= \frac{reserveA + swapA}{reserveA} \\
(inputA - swapA) * reserveA &= (reserveA + swapA) * (0.997 * swapA) \\
0.997 * swapA^2 + 1.997 * reserveA * swapA  &= reserveA * inputA
\end{align*}

- This is a quadratic equation in variable $swapA$ with solutions:

$$ \frac{- 1.997 * reserveA \pm \sqrt{(1.997 * reserveA)^2 + 4*0.997*reserveA * inputA}}{2 * 0.997}$$

## Solution in function `_getSwapAmount()` forked from Wivern
![](https://hackmd.io/_uploads/ryS6oOtPq.png)

Here two helper functions were used
![](https://hackmd.io/_uploads/rkeS3OFPq.png)
![](https://hackmd.io/_uploads/rk5L2dFvc.png)

\begin{align*}
nominator &= \frac{997 * inputA/2 * reserveB}{1000 * reserveA + 997 * inputA/2} \\
    &= \frac{0.997 * inputA/2 * reserveB}{reserveA + 0.997 * inputA/2} \\
denominator &= \frac{inputA/2 * (reserveB - nominator)}{reserveA + inputA/2} \\
&= \frac{inputA/2 * reserveB * reserveA}{(reserveA + inputA/2) * (reserveA + 0.997 * inputA/2)} \\
swapA &= inputA - \sqrt{(inputA/2)^2 * nominator / denominator} \\
&= inputA - inputA/2 * \sqrt{\frac{0.997*(reserveA + inputA/2)}{reserveA}}
\end{align*}

## Example computations using Wivern compared to our solution
#### 1. Ordinary liquidity addition:
Investing 0.01A in a 1A:2B pair
Result:0.0003% loss
```
Calculation:
investmentA: 10000000000000000
reserveA: 1000000000000000000
reserveB: 2000000000000000000
swapAmountA: 4995039960199483
add Liquidity
inputA: 5004960039800517
inputB: 9910753584279171
after Liquidity addition:
leftA: 29626550256
leftB: 0
LT received: 7042861096540742
```
Result of our solution: 5.44e-12% loss
```
swapAmountA: 4995054722102000
add Liquidity:
inputA: 5004945277898000
inputB: 9910782728509821
after Liquidity addition:
leftA: 544
leftB: 0
LT received: 7042881910394040
```
#### 2. High slippage test:
Investing 0.5A in a 1A:2B pair
Result: 2% loss
```
Calculation:
investmentA: 500000000000000000
reserveA: 1000000000000000000
reserveB: 2000000000000000000
swapAmountA: 220911080477923668
add Liquidity
inputA: 279088919522076332
inputB: 360989380129526577
after Liquidity addition:
leftA: 10185271924096540
leftB: 0
LT received: 311478199752102799
```
Result of our solution: 2.622e-13% loss
```
swapAmountA: 225082541740355000
add Liquidity:
inputA: 274917458259645000
inputB: 366556611012858573
after Liquidity addition:
leftA: 1311
leftB: 0
LT received: 317359838833070449
```
#### 3. Uneven ratio test:
Investing 1A in a 10000A:2B pair
Result: 0.0001% loss
```
investmentA: 1000000000000000000
reserveA: 10000000000000000000000
reserveB: 2000000000000000000
swapAmountA: 500738082265430336
add Liquidity
inputA: 499261917734569664
inputB: 99842189123531
after Liquidity addition:
leftA: 1051074823705
leftB: 0
LT received: 7060261353750524
```
Result of our solution: 5.306e-13% loss
```
swapAmountA: 500738608566016000
add Liquidity:
inputA: 499261391433984000
inputB: 99842294057390
after Liquidity addition:
leftA: 5306
leftB: 0
LT received: 7060268774435731
```
