export function Clamp(num: number, lower: number, upper: number) 
{
    return Math.min(Math.max(num, lower), upper);
}