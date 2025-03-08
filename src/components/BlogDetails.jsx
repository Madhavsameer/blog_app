import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, doc, addDoc, onSnapshot } from "firebase/firestore";
import "../styles/BlogDetails.css";
import SuggestedBlogs from "./SuggestedBlogs";

const BlogDetails = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [blogId, setBlogId] = useState(null);

  useEffect(() => {
    const fetchBlogBySlug = async () => {
      try {
        const blogsQuery = query(collection(db, "blogs"), where("slug", "==", slug));
        const querySnapshot = await getDocs(blogsQuery);

        if (!querySnapshot.empty) {
          const blogDoc = querySnapshot.docs[0];
          setBlog(blogDoc.data());
          setBlogId(blogDoc.id);
        } else {
          setBlog(null);
        }
      } catch (error) {
        console.error("Error fetching blog by slug:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogBySlug();
  }, [slug]);

  useEffect(() => {
    if (blogId) {
      const commentsRef = collection(db, "blogs", blogId, "comments");
      const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
        setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [blogId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;
    try {
      await addDoc(collection(db, "blogs", blogId, "comments"), {
        userName,
        text: newComment,
        timestamp: new Date().toISOString(),
      });
      setNewComment("");
      setUserName("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!blog) return <p className="error">Blog Not Found</p>;

  return (
    <div className="blog-details-container">
      <h2 className="blog-title">{blog.title}</h2>
      {blog.image && <img src={blog.image} alt={blog.title} className="blog-image" />}
      <p className="blog-description">{blog.description}</p>
      <div className="blog-content">
        {blog.content && blog.content.split("\n\n").map((paragraph, index) => (
          <p key={index} className="blog-paragraph">{paragraph}</p>
        ))}
      </div>
      <p className="blog-author"><strong>Author:</strong> {blog.author}</p>
      <p className="blog-date"><strong>Date:</strong> {blog.createdAt ? new Date(blog.createdAt).toDateString() : "No date available"}</p>
      {blog.tags && blog.tags.length > 0 && (
        <p className="blog-tags">
          <strong>Tags:</strong> {blog.tags.join(", ")}
        </p>
      )}

      {/* Comment Section */}
      <div className="comment-section">
        <h3>Comments</h3>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your Name"
            required
          />
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            required
          />
          <button type="submit">Post Comment</button>
        </form>
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment">
                <strong>{comment.userName}</strong>
                <p>{comment.text}</p>
                <small>{new Date(comment.timestamp).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
        </div>
      </div>

      <SuggestedBlogs />
    </div>
  );
};

export default BlogDetails;
