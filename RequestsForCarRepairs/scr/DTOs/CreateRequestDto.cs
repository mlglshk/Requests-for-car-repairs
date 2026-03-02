namespace RequestsForCarRepairs.API.DTOs;

public class CreateRequestDto
{
    public DateTime StartDate { get; set; }
    public string CarType { get; set; } = "";
    public string CarModel { get; set; } = "";
    public string ProblemDescription { get; set; } = "";
    public string RequestStatus { get; set; } = "";
    public DateTime? CompletionDate { get; set; }
    public string? RepairParts { get; set; }
    public int? MasterID { get; set; }
    public int ClientID { get; set; }
}