namespace RequestsForCarRepairs.API.DTOs;

public class CommentDto
{
    public int CommentID { get; set; }
    public string Message { get; set; } = "";
    public int MasterID { get; set; }
    public int RequestID { get; set; }
}