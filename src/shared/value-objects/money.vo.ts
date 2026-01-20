export class Money {
    private readonly cents: number;

    private constructor(cents: number) {
        if (!Number.isInteger(cents)) {
            throw new Error('Money value must be in cents (integer)');
        }
        this.cents = cents;
    }

    // Factory methods
    static fromCents(cents: number): Money {
        return new Money(cents);
    }

    static fromReais(reais: number): Money {
        return new Money(Math.round(reais * 100));
    }

    // Getters
    getCents(): number {
        return this.cents;
    }

    getReais(): number {
        return this.cents / 100;
    }

    // Formatação
    format(): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(this.getReais());
    }

    // Operações
    add(other: Money): Money {
        return new Money(this.cents + other.cents);
    }

    subtract(other: Money): Money {
        return new Money(this.cents - other.cents);
    }

    multiply(factor: number): Money {
        return new Money(Math.round(this.cents * factor));
    }

    divide(divisor: number): Money {
        return new Money(Math.round(this.cents / divisor));
    }

    isPositive(): boolean {
        return this.cents > 0;
    }

    isNegative(): boolean {
        return this.cents < 0;
    }

    isZero(): boolean {
        return this.cents === 0;
    }

    equals(other: Money): boolean {
        return this.cents === other.cents;
    }

    // Para JSON
    toJSON() {
        return {
            cents: this.cents,
            reais: this.getReais(),
            formatted: this.format(),
        };
    }
}
