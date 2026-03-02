namespace RequestsForCarRepairs.API.DTOs;

public class CreateCommentDto
{
    public string Message { get; set; } = "";
    public int MasterID { get; set; }
    public int RequestID { get; set; }
}