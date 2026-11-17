export function RemToPx(rem: number): number 
{
    const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
    );

    return rem * rootFontSize;
}

export function GetSpacing()
{
    return RemToPx(parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue("--spacing")
        .trim())); // "0.25rem" by default
}