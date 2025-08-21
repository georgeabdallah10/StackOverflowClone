
export default function level(points: number){
    if (points >= 1 && points < 15){
        return 1;
    } else if (points >= 15 && points < 50){
        return 2
    } else if (points >= 50 && points < 125){
        return 3
    } else if (points >= 125 && points < 1000){
        return 4
    } else if (points >= 1000 && points < 3000){
        return 5
    } else if (points >= 3000 && points < 10000){
        return 6
    } else{
        return 7
    }
}

