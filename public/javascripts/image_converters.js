/**
 * Created by Christiaan on 2016-08-22.
 */
function ActivityTypeToImage(value) {
    switch (value)
    {
        case "group_ride":
            return "/images/bike.svg";
        case "group_run":
            return "/images/run.svg";
        case "group_ski":
            return "/images/ski.svg";
        case "race":
            return "/images/race.svg";
        case "triathlon":
            return "/images/triathlon.svg";
        default:
            return "/images/unknown.svg";
    }
}

function ActivityTypeToString(value) {
    switch (value)
    {
        case "group_ride":
            return "Ride";
        case "group_run":
            return "Run";
        case "group_ski":
            return "Ski";
        case "race":
            return "Race";
        case "triathlon":
            return "Triathlon";
        default:
            return "Unknown";
    }
}

function SegmentTypeToImage(value) {
    switch (value)
    {
        case "Ride":
            return "/images/bike.svg";
        case "Run":
            return "/images/run.svg";
        case "Swim":
            return "/images/swim.svg";
        case "Ski":
            return "/images/ski.svg";
        default:
            return "/images/unknown.svg";
    }
}

function RouteTypeToImage(value)
{
    switch (value)
    {
        case 1:
            return "/images/bike.svg";
        case 2:
            return "/images/run.svg";
        default:
            return "/images/unknown.svg";
    }
}